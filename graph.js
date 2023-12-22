const labels = ["90d", "30d", "7d", "24h"];
const ctx = document.getElementById("priceChart").getContext("2d");
export function generateGraph(totalWorth, totalWorthWeek, totalWorthMonth, totalWorth3Month) {
    console.log("GRAPH")
    let priceChart = null;
    ctx.canvas.style.borderColor = "darkgray";
     priceChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Price Trend",
            data: [totalWorth3Month, totalWorthMonth, totalWorthWeek, totalWorth],
            backgroundColor: "lightgreen",
            borderColor: "lightgreen",
            borderWidth: 3, 
            pointBackgroundColor: "lightgreen", 
            pointBorderColor: "lightgreen", 
            pointRadius: 2, 
            pointHoverRadius: 8, 
            pointHoverBorderColor: "lightgreen", 
          },
        ],
      },
      options: {
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              borderColor: "rgba(255, 255, 255, 1)", 
              borderWidth: '50px', 
              color: 'rgba(255, 255, 255, 0.3)'
            },
            ticks:{
              font:{
                weight:'bold'
              }
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              borderColor: "rgba(255, 255, 255, 1)", 
              borderWidth: '50px', 
              color: 'rgba(255, 255, 255, 0.3)'
            },
            ticks:{
              font:{
                weight:'bold'
              }
            }
          },
        },
      },
    });
  }