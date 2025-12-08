from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone
import random
import numpy as np
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class ThreatLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ip_address: str
    port: int
    protocol: str
    request_count: int
    decision: Literal["ALLOW", "BLOCK", "FLAG"]
    risk_score: int
    reasons: List[str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload_size: Optional[int] = None
    country: Optional[str] = None

class ThreatLogCreate(BaseModel):
    ip_address: str
    port: int
    protocol: str
    request_count: int = 1
    payload_size: Optional[int] = None

class BlacklistedIP(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ip_address: str
    reason: str
    blocked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    block_count: int = 1

class BlacklistCreate(BaseModel):
    ip_address: str
    reason: str

class TrafficStats(BaseModel):
    total_requests: int
    allowed: int
    blocked: int
    flagged: int
    high_risk_ips: int

class SimulatorControl(BaseModel):
    action: Literal["start", "stop", "status"]

# Threat Detection Engine
class ThreatDetector:
    SUSPICIOUS_PORTS = [21, 22, 23, 135, 139, 445, 1433, 3306, 3389, 5432, 6379, 27017]
    MALICIOUS_PROTOCOLS = ["telnet", "ftp", "smb"]
    
    @staticmethod
    def analyze_request(ip: str, port: int, protocol: str, request_count: int, payload_size: Optional[int] = None) -> dict:
        risk_score = 0
        reasons = []
        
        # Check suspicious ports
        if port in ThreatDetector.SUSPICIOUS_PORTS:
            risk_score += 25
            reasons.append(f"Suspicious port {port} detected")
        
        # Check malicious protocols
        if protocol.lower() in ThreatDetector.MALICIOUS_PROTOCOLS:
            risk_score += 30
            reasons.append(f"Potentially malicious protocol: {protocol}")
        
        # Check request frequency
        if request_count > 10:
            risk_score += 20
            reasons.append(f"High request frequency: {request_count} attempts")
        
        if request_count > 20:
            risk_score += 15
            reasons.append("Possible brute force attack")
        
        # Check payload size anomalies
        if payload_size:
            if payload_size > 10000:
                risk_score += 15
                reasons.append("Unusually large payload detected")
            elif payload_size < 10:
                risk_score += 10
                reasons.append("Suspicious minimal payload")
        
        # Port scanning detection
        if port > 60000 or port < 20:
            risk_score += 10
            reasons.append("Unusual port access pattern")
        
        # Determine decision
        if risk_score >= 70:
            decision = "BLOCK"
        elif risk_score >= 40:
            decision = "FLAG"
        else:
            decision = "ALLOW"
            if not reasons:
                reasons.append("Normal traffic pattern")
        
        return {
            "decision": decision,
            "risk_score": min(risk_score, 100),
            "reasons": reasons
        }

# Traffic Simulator
class TrafficSimulator:
    def __init__(self):
        self.running = False
        self.task = None
    
    def generate_traffic(self) -> dict:
        """Generate realistic simulated traffic"""
        scenarios = [
            # Normal traffic (60%)
            {"weight": 0.6, "type": "normal", "port_range": [80, 443, 8080, 8443], 
             "protocols": ["http", "https"], "request_range": (1, 3)},
            # Suspicious traffic (25%)
            {"weight": 0.25, "type": "suspicious", "port_range": [22, 23, 3389, 445, 3306],
             "protocols": ["ssh", "telnet", "rdp", "smb", "mysql"], "request_range": (5, 15)},
            # Malicious traffic (15%)
            {"weight": 0.15, "type": "malicious", "port_range": [21, 23, 135, 139, 445],
             "protocols": ["ftp", "telnet", "smb"], "request_range": (15, 30)},
        ]
        
        scenario = random.choices(scenarios, weights=[s["weight"] for s in scenarios])[0]
        
        ip = f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}"
        port = random.choice(scenario["port_range"])
        protocol = random.choice(scenario["protocols"])
        request_count = random.randint(*scenario["request_range"])
        payload_size = random.randint(100, 15000) if random.random() > 0.3 else None
        
        return {
            "ip_address": ip,
            "port": port,
            "protocol": protocol,
            "request_count": request_count,
            "payload_size": payload_size
        }

simulator = TrafficSimulator()

# Endpoints
@api_router.get("/")
async def root():
    return {"message": "Sentinel AI Firewall Active"}

@api_router.post("/threats/analyze", response_model=ThreatLog)
async def analyze_threat(input: ThreatLogCreate):
    """Analyze a single traffic request"""
    # Check if IP is blacklisted
    blacklisted = await db.blacklist.find_one({"ip_address": input.ip_address}, {"_id": 0})
    
    if blacklisted:
        analysis = {
            "decision": "BLOCK",
            "risk_score": 100,
            "reasons": ["IP is blacklisted", blacklisted.get("reason", "Previous malicious activity")]
        }
    else:
        analysis = ThreatDetector.analyze_request(
            input.ip_address, input.port, input.protocol, 
            input.request_count, input.payload_size
        )
    
    threat_log = ThreatLog(
        **input.model_dump(),
        **analysis
    )
    
    doc = threat_log.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.threat_logs.insert_one(doc)
    
    # Auto-blacklist if blocked multiple times
    if threat_log.decision == "BLOCK":
        existing_blocks = await db.threat_logs.count_documents({
            "ip_address": input.ip_address,
            "decision": "BLOCK"
        })
        
        if existing_blocks >= 3:
            existing_blacklist = await db.blacklist.find_one({"ip_address": input.ip_address})
            if not existing_blacklist:
                blacklist_entry = BlacklistedIP(
                    ip_address=input.ip_address,
                    reason="Auto-blacklisted: Multiple blocked attempts",
                    block_count=existing_blocks
                )
                bl_doc = blacklist_entry.model_dump()
                bl_doc['blocked_at'] = bl_doc['blocked_at'].isoformat()
                await db.blacklist.insert_one(bl_doc)
    
    return threat_log

@api_router.get("/threats/logs", response_model=List[ThreatLog])
async def get_threat_logs(limit: int = 100, decision: Optional[str] = None):
    """Get threat logs with optional filtering"""
    query = {}
    if decision:
        query["decision"] = decision.upper()
    
    logs = await db.threat_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log['timestamp'], str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

@api_router.get("/threats/stats", response_model=TrafficStats)
async def get_traffic_stats():
    """Get traffic statistics"""
    total = await db.threat_logs.count_documents({})
    allowed = await db.threat_logs.count_documents({"decision": "ALLOW"})
    blocked = await db.threat_logs.count_documents({"decision": "BLOCK"})
    flagged = await db.threat_logs.count_documents({"decision": "FLAG"})
    
    # Count unique IPs with high risk
    high_risk_pipeline = [
        {"$match": {"risk_score": {"$gte": 70}}},
        {"$group": {"_id": "$ip_address"}},
        {"$count": "total"}
    ]
    high_risk_result = await db.threat_logs.aggregate(high_risk_pipeline).to_list(1)
    high_risk_ips = high_risk_result[0]["total"] if high_risk_result else 0
    
    return TrafficStats(
        total_requests=total,
        allowed=allowed,
        blocked=blocked,
        flagged=flagged,
        high_risk_ips=high_risk_ips
    )

@api_router.get("/blacklist", response_model=List[BlacklistedIP])
async def get_blacklist():
    """Get all blacklisted IPs"""
    blacklist = await db.blacklist.find({}, {"_id": 0}).sort("blocked_at", -1).to_list(1000)
    
    for item in blacklist:
        if isinstance(item['blocked_at'], str):
            item['blocked_at'] = datetime.fromisoformat(item['blocked_at'])
    
    return blacklist

@api_router.post("/blacklist", response_model=BlacklistedIP)
async def add_to_blacklist(input: BlacklistCreate):
    """Manually add an IP to blacklist"""
    existing = await db.blacklist.find_one({"ip_address": input.ip_address})
    if existing:
        raise HTTPException(status_code=400, detail="IP already blacklisted")
    
    blacklist_entry = BlacklistedIP(**input.model_dump())
    doc = blacklist_entry.model_dump()
    doc['blocked_at'] = doc['blocked_at'].isoformat()
    await db.blacklist.insert_one(doc)
    
    return blacklist_entry

@api_router.delete("/blacklist/{ip_address}")
async def remove_from_blacklist(ip_address: str):
    """Remove an IP from blacklist"""
    result = await db.blacklist.delete_one({"ip_address": ip_address})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="IP not found in blacklist")
    return {"message": f"IP {ip_address} removed from blacklist"}

@api_router.post("/simulator/control")
async def control_simulator(control: SimulatorControl):
    """Control traffic simulator"""
    if control.action == "start":
        if simulator.running:
            return {"status": "already_running", "message": "Simulator is already running"}
        simulator.running = True
        return {"status": "started", "message": "Traffic simulator started"}
    
    elif control.action == "stop":
        if not simulator.running:
            return {"status": "not_running", "message": "Simulator is not running"}
        simulator.running = False
        return {"status": "stopped", "message": "Traffic simulator stopped"}
    
    elif control.action == "status":
        return {
            "status": "running" if simulator.running else "stopped",
            "message": f"Simulator is {'running' if simulator.running else 'stopped'}"
        }

@api_router.post("/simulator/generate")
async def generate_traffic():
    """Generate a single simulated traffic request"""
    traffic_data = simulator.generate_traffic()
    threat_create = ThreatLogCreate(**traffic_data)
    result = await analyze_threat(threat_create)
    return result

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()