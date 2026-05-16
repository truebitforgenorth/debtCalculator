document.addEventListener("DOMContentLoaded", () => {
  const calculateBtn = document.getElementById("calculateDti");
  const resultsCard = document.getElementById("dtiResults");

  if (!calculateBtn || !resultsCard) {
    return;
  }

  const formatCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function valueOf(id) {
    return parseFloat(document.getElementById(id)?.value) || 0;
  }

  function getStatus(ratio) {
    if (ratio < 20) {
      return {
        label: "Excellent breathing room",
        summary: "Your monthly debt load is light relative to your gross income.",
        className: "status-good"
      };
    }

    if (ratio < 36) {
      return {
        label: "Healthy range",
        summary: "Your debt appears manageable, though payoff progress still depends on your full budget.",
        className: "status-good"
      };
    }

    if (ratio < 43) {
      return {
        label: "Approaching the edge",
        summary: "Your debt load is getting heavier, so extra borrowing could limit your flexibility.",
        className: "status-watch"
      };
    }

    return {
      label: "High debt pressure",
      summary: "A large share of your income is already committed to debt, so reducing balances should be a priority.",
      className: "status-alert"
    };
  }

  calculateBtn.addEventListener("click", () => {
    const grossIncome = valueOf("grossIncome");
    const housing = valueOf("housing");
    const autoLoan = valueOf("autoLoan");
    const studentLoans = valueOf("studentLoans");
    const creditCards = valueOf("creditCards");
    const otherDebt = valueOf("otherDebt");

    if (grossIncome <= 0) {
      alert("Enter your gross monthly income to calculate your DTI ratio.");
      return;
    }

    const totalDebt = housing + autoLoan + studentLoans + creditCards + otherDebt;
    const ratio = (totalDebt / grossIncome) * 100;
    const status = getStatus(ratio);
    const statusChip = document.getElementById("dtiStatus");

    document.getElementById("dtiPercent").textContent = `${ratio.toFixed(1)}%`;
    document.getElementById("dtiSummary").textContent = status.summary;
    document.getElementById("totalDebt").textContent = formatCurrency.format(totalDebt);
    document.getElementById("incomeValue").textContent = formatCurrency.format(grossIncome);

    statusChip.textContent = status.label;
    statusChip.className = `status-chip mt-4 ${status.className}`;

    resultsCard.classList.remove("d-none");
  });

  document.getElementById("grossIncome").value = 5200;
  document.getElementById("housing").value = 1450;
  document.getElementById("autoLoan").value = 360;
  document.getElementById("studentLoans").value = 175;
  document.getElementById("creditCards").value = 210;
  document.getElementById("otherDebt").value = 85;
});
