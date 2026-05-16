document.addEventListener("DOMContentLoaded", () => {
  const addDebtBtn = document.getElementById("add-debt");
  const calculateBtn = document.getElementById("calculate");
  const debtsDiv = document.getElementById("debts");

  if (!addDebtBtn || !calculateBtn || !debtsDiv) {
    return;
  }

  let debtCount = 0;

  function currency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  function addDebtRow(defaults = {}) {
    const row = document.createElement("div");
    row.className = "debt-row card border-0 bg-light-subtle p-3 mb-3";
    row.innerHTML = `
      <div class="row g-2">
        <div class="col-md-3">
          <label class="form-label small text-muted" for="name-${debtCount}">Debt Name</label>
          <input type="text" placeholder="Credit card" id="name-${debtCount}" class="form-control" value="${defaults.name || ""}" />
        </div>
        <div class="col-md-3">
          <label class="form-label small text-muted" for="balance-${debtCount}">Balance ($)</label>
          <input type="number" placeholder="4500" id="balance-${debtCount}" class="form-control" min="0" step="0.01" value="${defaults.balance || ""}" />
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted" for="rate-${debtCount}">APR (%)</label>
          <input type="number" placeholder="18.9" id="rate-${debtCount}" class="form-control" min="0" step="0.01" value="${defaults.rate || ""}" />
        </div>
        <div class="col-md-2">
          <label class="form-label small text-muted" for="min-${debtCount}">Min Payment ($)</label>
          <input type="number" placeholder="120" id="min-${debtCount}" class="form-control" min="0" step="0.01" value="${defaults.min || ""}" />
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button type="button" class="btn btn-outline-danger w-100 remove-debt">Remove</button>
        </div>
      </div>
    `;

    row.querySelector(".remove-debt").addEventListener("click", () => {
      row.remove();
    });

    debtsDiv.appendChild(row);
    debtCount += 1;
  }

  function collectDebts() {
    const debts = [];

    for (let i = 0; i < debtCount; i += 1) {
      const name = document.getElementById(`name-${i}`);
      const balance = document.getElementById(`balance-${i}`);
      const rate = document.getElementById(`rate-${i}`);
      const min = document.getElementById(`min-${i}`);

      if (!name || !balance || !rate || !min) {
        continue;
      }

      const debt = {
        name: name.value.trim() || `Debt ${debts.length + 1}`,
        balance: parseFloat(balance.value),
        rate: parseFloat(rate.value) / 100,
        min: parseFloat(min.value)
      };

      if (Number.isFinite(debt.balance) && debt.balance > 0 && Number.isFinite(debt.min) && debt.min > 0) {
        debt.rate = Number.isFinite(debt.rate) && debt.rate >= 0 ? debt.rate : 0;
        debts.push(debt);
      }
    }

    return debts;
  }

  function calculateDebts(debts, extra, strategy) {
    let month = 0;
    let totalInterest = 0;
    const balancesOverTime = [];
    const clonedDebts = JSON.parse(JSON.stringify(debts));

    while (clonedDebts.some((debt) => debt.balance > 0.01) && month < 600) {
      month += 1;

      if (strategy === "snowball") {
        clonedDebts.sort((a, b) => a.balance - b.balance);
      } else if (strategy === "avalanche") {
        clonedDebts.sort((a, b) => b.rate - a.rate);
      } else if (strategy === "income") {
        clonedDebts.sort((a, b) => b.min - a.min);
      }

      let rollover = extra;

      clonedDebts.forEach((debt) => {
        if (debt.balance <= 0) {
          return;
        }

        const interest = (debt.balance * debt.rate) / 12;
        totalInterest += interest;
        debt.balance += interest;

        const scheduledPayment = Math.min(debt.balance, debt.min + rollover);
        rollover = Math.max(0, rollover - Math.max(0, scheduledPayment - debt.min));
        debt.balance = Math.max(0, debt.balance - scheduledPayment);
      });

      balancesOverTime.push({
        month,
        total: clonedDebts.reduce((sum, debt) => sum + debt.balance, 0)
      });
    }

    const debtFreeDate = new Date();
    debtFreeDate.setMonth(debtFreeDate.getMonth() + month);

    return {
      debtFreeDate: debtFreeDate.toLocaleDateString(),
      totalInterest: totalInterest.toFixed(2),
      months: month,
      balancesOverTime
    };
  }

  function displayResults(results) {
    document.getElementById("results").classList.remove("d-none");
    document.getElementById("debtFreeDate").textContent = results.debtFreeDate;
    document.getElementById("totalInterest").textContent = results.totalInterest;
    document.getElementById("months").textContent = results.months;

    const canvas = document.getElementById("chart");
    canvas.height = 400;

    if (window.debtChart) {
      window.debtChart.destroy();
    }

    window.debtChart = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: results.balancesOverTime.map((point) => point.month),
        datasets: [{
          label: "Total Debt Balance",
          data: results.balancesOverTime.map((point) => point.total),
          borderColor: "#2d6a4f",
          backgroundColor: "rgba(45, 106, 79, 0.18)",
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Months"
            }
          },
          y: {
            title: {
              display: true,
              text: "Total Balance ($)"
            }
          }
        }
      }
    });
  }

  addDebtBtn.addEventListener("click", () => addDebtRow());

  calculateBtn.addEventListener("click", () => {
    const debts = collectDebts();

    if (debts.length === 0) {
      alert("Add at least one debt with a balance and minimum payment.");
      return;
    }

    const extraInput = parseFloat(document.getElementById("extra").value) || 0;
    const income = parseFloat(document.getElementById("income")?.value) || 0;
    const percent = parseFloat(document.getElementById("percent")?.value) || 0;
    const strategy = document.getElementById("strategy").value;

    let extra = extraInput;

    if (strategy === "income" && income > 0 && percent > 0) {
      const totalToDebt = income * (percent / 100);
      const minimumPayments = debts.reduce((sum, debt) => sum + debt.min, 0);
      extra = Math.max(totalToDebt - minimumPayments, 0);
    }

    const results = calculateDebts(debts, extra, strategy);
    displayResults(results);
  });

  addDebtRow({
    name: "Credit Card",
    balance: 4200,
    rate: 19.9,
    min: 125
  });

  addDebtRow({
    name: "Car Loan",
    balance: 9800,
    rate: 6.4,
    min: 280
  });

  document.getElementById("extra").value = 150;
  document.getElementById("income").value = 4200;
  document.getElementById("percent").value = 18;
});
