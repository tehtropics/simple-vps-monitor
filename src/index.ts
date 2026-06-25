import express, { type NextFunction } from "express";
import session from "express-session";
import { type RequestHandler } from "express";
import pool from "./db.js";
import si from "systeminformation";
import "dotenv/config";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());

app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
);

app.listen(3000);

const authMiddleware: RequestHandler = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.status(401).json("Not authorized");
  }
};

app.get("/status", authMiddleware, async (req, res) => {
  try {
    const sysTime = si.time();
    res.json({
      cpu: cpuDataList,
      mem: memDataList,
      memAdjusted: memAdjustedList,
      time: new Date(sysTime.current).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Error getting system information" });
  }
});

app.get("/history", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM downtime");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
    console.log(err);
  }
});

app.post("/login", (req, res) => {
  if (
    req.body.username === process.env.USERNAME &&
    req.body.password === process.env.PASSWORD
  ) {
    req.session.loggedIn = true;
    return res.status(200).json({ info: "login successful" });
  } else {
    return res.status(401).json({ info: "invalid username/password" });
  }
});

const cpuDataList: Array<number> = [];
const memDataList: Array<number> = [];
const memAdjustedList: Array<number> = [];

const getCurrentData = setInterval(async () => {
  try {
    const cpu = (await si.currentLoad()).currentLoad;
    const mem = await si.mem();
    const calcMem = (mem.used / mem.total) * 100;
    const calcMemAdjusted = ((mem.used - mem.cached - mem.buffers) / mem.total) * 100;

    cpuDataList.push(cpu);
    memDataList.push(calcMem);
    memAdjustedList.push(calcMemAdjusted);

    if (cpuDataList.length >= 10 || memDataList.length >= 10) {
      cpuDataList.splice(0, 1);
      memDataList.splice(0, 1);
      memAdjustedList.splice(0, 1);
    }
  } catch (err) {
    console.log("getCurrentData:" + err);
  }

  console.table(cpuDataList);
  console.table(memDataList);
}, 1000);
