import si from "systeminformation";
import "dotenv/config";
import pool from "./db.js";

async function is_running(process: string) {
  try {
    const proc = await si.processes();
    const newProc = proc.list.filter(
      (p) => p.name == process || p.name.endsWith("/" + process),
    );

    return newProc.length > 0;
  } catch (err) {
    console.log("si.processess() failed: " + err);
    return false;
  }
}

const state: Record<string, boolean> = {
  chat_server: await is_running("chat_server"),
};

const watchdog = setInterval(async () => {
  try {
    for (const name of Object.keys(state)) {
      const running = await is_running(name);
      if (running != state[name]) {
        state[name] = !state[name];
        if (state[name]) {
          console.log(name + " back up");
          // could do nothing when watchdog started when process was already down but wtv
          await pool.query(
            "UPDATE downtime SET came_back_at = $1 WHERE process_name = $2 AND came_back_at IS NULL",
            [new Date(), name],
          );
        } else {
          await pool.query(
            "INSERT INTO downtime (process_name, went_down_at) VALUES ($1, $2)",
            [name, new Date()],
          );
          console.log(name + " went down");
        }
      }
    }
  } catch (err) {
    console.log("Error: " + err);
  }
}, 10000);
