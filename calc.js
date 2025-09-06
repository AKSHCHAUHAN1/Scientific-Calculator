let _trigFuncs = {};

document.addEventListener("DOMContentLoaded", function () {
    const output = document.getElementById("output");
    const buttons = document.querySelectorAll(".button-grid button");
    const historyBtn = document.querySelector(".history");
    const historyModal = document.getElementById("history-modal");
    const closeModalBtn = document.querySelector(".close-button");
    const historyListUl = document.getElementById("history-list-ul");
    let historyList = [];
    let isInvActive = false;
    let currentAngleUnit = 'deg';
    let calculationDone = false;
    const sinBtn = document.getElementById('sin-btn');
    const cosBtn = document.getElementById('cos-btn');
    const tanBtn = document.getElementById('tan-btn');
    const logBtn = document.getElementById('log-btn');
    const lnBtn = document.getElementById('ln-btn');
    const sqrtX2Btn = document.getElementById('sqrt-x2-btn');
    const invBtn = document.getElementById('inv-btn');
    const toRadians = degrees => degrees * (Math.PI / 180);
    const toDegrees = radians => radians * (180 / Math.PI);
    _trigFuncs = {
        sin: val => currentAngleUnit === 'deg' ? Math.sin(toRadians(val)) : Math.sin(val),
        cos: val => currentAngleUnit === 'deg' ? Math.cos(toRadians(val)) : Math.cos(val),
        tan: val => currentAngleUnit === 'deg' ? Math.tan(toRadians(val)) : Math.tan(val),
        asin: val => currentAngleUnit === 'deg' ? toDegrees(Math.asin(val)) : Math.asin(val),
        acos: val => currentAngleUnit === 'deg' ? toDegrees(Math.acos(val)) : Math.acos(val),
        atan: val => currentAngleUnit === 'deg' ? toDegrees(Math.atan(val)) : Math.atan(val),
    };
    historyBtn.addEventListener("click", () => {
        historyListUl.innerHTML = "";
        if (historyList.length === 0) {
            historyListUl.innerHTML = "<li>No history yet.</li>";
        } else {
            [...historyList].reverse().forEach(item => {
                const li = document.createElement("li");
                li.textContent = item;
                historyListUl.appendChild(li);
            });
        }
        historyModal.style.display = "block";
    });
    closeModalBtn.addEventListener("click", () => historyModal.style.display = "none");
    window.addEventListener("click", (event) => {
        if (event.target == historyModal) historyModal.style.display = "none";
    });
    const radDegButtons = document.querySelectorAll('[data-function-type="rad-deg"]');
    radDegButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            radDegButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAngleUnit = btn.textContent;
        });
    });
    invBtn.addEventListener('click', () => {
        isInvActive = !isInvActive;
        invBtn.classList.toggle('active', isInvActive);
        toggleScientificFunctions();
    });
    function toggleScientificFunctions() {
        sinBtn.innerHTML = isInvActive ? "sin<sup>-1</sup>" : "sin";
        cosBtn.innerHTML = isInvActive ? "cos<sup>-1</sup>" : "cos";
        tanBtn.innerHTML = isInvActive ? "tan<sup>-1</sup>" : "tan";
        logBtn.innerHTML = isInvActive ? "10<sup>x</sup>" : "log";
        lnBtn.innerHTML = isInvActive ? "e<sup>x</sup>" : "ln";
        sqrtX2Btn.innerHTML = isInvActive ? "x<sup>2</sup>" : "√";
    }
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            handleInput(this);
        });
    });
    function handleInput(buttonElement) {
        const buttonText = buttonElement.innerHTML;
        if (calculationDone) {
            const isOperator = /[+\-X÷^%]/.test(buttonText);
            if (!isOperator) {
                output.textContent = '';
            }
            calculationDone = false;
        }
        const functionMap = {
            "sin": "sin(", "cos": "cos(", "tan": "tan(",
            "sin<sup>-1</sup>": "asin(", "cos<sup>-1</sup>": "acos(", "tan<sup>-1</sup>": "atan(",
            "log": "log(", "ln": "ln(", "√": "sqrt(",
            "10<sup>x</sup>": "10^", "e<sup>x</sup>": "e^", "x<sup>2</sup>": "^2",
            "!": "!"
        };
        if (functionMap[buttonText]) {
            output.textContent += functionMap[buttonText];
            return;
        }
        switch (buttonText) {
            case "AC":
                output.textContent = "";
                break;
            case "⌫":
                output.textContent = output.textContent.slice(0, -1);
                break;
            case "=":
                try {
                    let expression = output.textContent.trim();
                    const openBrackets = (expression.match(/\(/g) || []).length;
                    const closeBrackets = (expression.match(/\)/g) || []).length;
                    if (openBrackets > closeBrackets) {
                        expression += ')'.repeat(openBrackets - closeBrackets);
                    }
                    expression = expression.replace(/\s+/g, '');
                    expression = expression.replace(/(\d|\))(?=[A-Za-zπ_\(])/g, '$1*');
                    expression = expression.replace(/\)(?=\d)/g, ')*');
                    expression = expression.replace(/(π|e)(?=[\dA-Za-z_\(])/g, '$1*');
                    expression = expression.replace(/(\d+\.?\d*|\))%/g, (m, num) => `(${num}/100)`);
                    let sanitizedExpression = expression
                        .replace(/\basin\(/g, "_trigFuncs.asin(")
                        .replace(/\bacos\(/g, "_trigFuncs.acos(")
                        .replace(/\batan\(/g, "_trigFuncs.atan(")
                        .replace(/\bsin\(/g, "_trigFuncs.sin(")
                        .replace(/\bcos\(/g, "_trigFuncs.cos(")
                        .replace(/\btan\(/g, "_trigFuncs.tan(")
                        .replace(/\blog\(/g, "Math.log10(")
                        .replace(/\bln\(/g, "Math.log(")
                        .replace(/\bsqrt\(/g, "Math.sqrt(")
                        .replace(/X/g, "*")
                        .replace(/÷/g, "/")
                        .replace(/\^/g, "**")
                        .replace(/π/g, "Math.PI")
                        .replace(/\be\b/g, "Math.E");
                    sanitizedExpression = sanitizedExpression.replace(/(\d+)!/g, (m, n) => {
                        const val = factorial(parseInt(n, 10));
                        if (val === "Error") throw new Error("Invalid factorial");
                        return String(val);
                    });
                    console.log("SANITIZED expression ->", sanitizedExpression);
                    const result = eval(sanitizedExpression);
                    if (!isFinite(result)) {
                        throw new Error("Invalid result (NaN or Infinity)");
                    }
                    historyList.push(`${output.textContent} = ${result}`);
                    if (historyList.length > 20) historyList.shift();
                    output.textContent = result;
                    calculationDone = true;
                } catch (e) {
                    console.error("Calculation Error:", e);
                    output.textContent = "Error";
                    calculationDone = true;
                }
                break;
            case "rad": case "deg": case "inv":
                break;
            default:
                output.textContent += buttonElement.textContent;
        }
    }
    function factorial(n) {
        if (n < 0 || n % 1 !== 0) return "Error";
        if (n > 170) return "Infinity";
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = n; i > 1; i--) {
            result *= i;
        }
        return result;
    }
});
