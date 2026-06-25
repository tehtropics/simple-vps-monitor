const cpuCtx = document.getElementById("cpu-chart");
const memCtx = document.getElementById("mem-chart");

async function checkLogin() {
  const auth = await fetch("/status");
  if (!auth.ok) {
    window.location.href = "/login";
  }
}

async function main() {
  await checkLogin();
  async function getData() {
    const res = await fetch("/status");
    return await res.json();
  }

  async function getHistory() {
    const res = await fetch("/history");
    const data = await res.json();
    return data;
  }

  const cpuChart = new Chart(cpuCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "CPU %",
          data: [],
          borderColor: "#4ade80",
          backgroundColor: "rgba(74, 222, 128, 0.15)",
          fill: true,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });

  const memChart = new Chart(memCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "MEM % (raw)",
          data: [],
          borderColor: "#4ade80",
          backgroundColor: "rgba(74, 222, 128, 0.15)",
          fill: true,
        },
        {
          label: "MEM % (adjusted)",
          data: [],
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96, 165, 250, 0.15)",
          fill: true,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });

  const histBody = document.getElementById("history-body");

  setInterval(async () => {
    const histData = await getHistory();
    histBody.innerHTML = "";

    for (const row of histData) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${row.process_name}</td>
          <td>${new Date(row.went_down_at).toLocaleString()}</td>
          <td>${row.came_back_at ? new Date(row.came_back_at).toLocaleString() : "Still down"}</td>
          `;
      histBody.appendChild(tr);
    }
    const data = await getData();
    cpuChart.data.labels = data.cpu.map((_, i) => i + 1);
    cpuChart.data.datasets[0].data = data.cpu;
    cpuChart.update();

    memChart.data.labels = data.mem.map((_, i) => i + 1);
    memChart.data.datasets[0].data = data.mem;
    memChart.data.datasets[1].data = data.memAdjusted;
    memChart.update();
  }, 1000);
}
main();
