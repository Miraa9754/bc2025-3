const { program } = require('commander');
const fs = require('fs');
const path = require('path');

program
  .requiredOption('-i, --input <file>', 'шлях до файлу для читання')
  .option('-o, --output <file>', 'шлях до файлу для запису результату')
  .option('-d, --display', 'вивести результат у консоль')
  .option('-h, --humidity', 'додати вологість вдень (Humidity3pm)')
  .option('-r, --rainfall <value>', 'фільтрувати записи за кількістю опадів > значення');

program.parse(process.argv);
const options = program.opts();

// --- Перевірка обов’язкового параметра ---
if (!options.input) {
  console.error("Please, specify input file");
  process.exit(1);
}

const inputPath = path.resolve(options.input);

// --- Перевірка існування файлу ---
if (!fs.existsSync(inputPath)) {
  console.error("Cannot find input file");
  process.exit(1);
}

// --- Читаємо файл ---
let data;
try {
  data = fs.readFileSync(inputPath, 'utf-8');
  data = JSON.parse(data);
} catch (err) {
  console.error("Error reading or parsing input file:", err.message);
  process.exit(1);
}

// --- Обробка даних ---
let result = data;

// Фільтрація за rainfall
if (options.rainfall) {
  const minRain = parseFloat(options.rainfall);
  result = result.filter(item => parseFloat(item.Rainfall) > minRain);
}

// Формуємо вивід
let outputLines = result.map(item => {
  const rainfall = item.Rainfall ?? "N/A";
  const pressure = item.Pressure3pm ?? "N/A";
  const humidity = options.humidity ? (item.Humidity3pm ?? "N/A") : null;

  return options.humidity
    ? `${rainfall} ${pressure} ${humidity}`
    : `${rainfall} ${pressure}`;
});

// Якщо нічого не знайшлося
if (outputLines.length === 0) {
  outputLines = ["No matching records found."];
}

const finalOutput = outputLines.join('\n');

// --- Вивід/запис ---
if (options.output) {
  const outputPath = path.resolve(options.output);
  fs.writeFileSync(outputPath, finalOutput, 'utf-8');
}

if (options.display) {
  console.log(finalOutput);
}

// Якщо немає -o і -d → нічого не робимо
