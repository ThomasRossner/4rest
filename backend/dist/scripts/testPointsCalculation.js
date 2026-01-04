import 'dotenv/config';
import { getTaskParameters } from '../services/parameter.service.js';
import { getPointsCalculationFactor } from '../services/system-config.service.js';
async function testCalculation() {
    console.log('=== Testing Points Calculation ===\n');
    // Get parameters
    const difficultyParams = await getTaskParameters('difficulty');
    const timeRequiredParams = await getTaskParameters('time_required');
    const factor = await getPointsCalculationFactor();
    console.log(`Factor: ${factor}\n`);
    console.log('Difficulty weights:');
    difficultyParams.forEach(p => {
        const weight = p.weight ?? p.display_order ?? 1;
        console.log(`  ${p.value}: weight=${weight} (type: ${typeof weight})`);
    });
    console.log('\nTime required weights:');
    timeRequiredParams.forEach(p => {
        const weight = p.weight ?? p.display_order ?? 1;
        console.log(`  ${p.value}: weight=${weight} (type: ${typeof weight})`);
    });
    console.log('\n=== Test Calculations ===\n');
    // Test cases
    const testCases = [
        { difficulty: 'sehr einfach', time: '1-3 Min' },
        { difficulty: 'einfach', time: '3-10 Min' },
        { difficulty: 'mittel', time: '1-3 Min' },
        { difficulty: 'mittel', time: '60+ Min' },
        { difficulty: 'schwer', time: '60+ Min' },
        { difficulty: 'sehr schwer', time: '60+ Min' },
    ];
    for (const test of testCases) {
        const difficultyParam = difficultyParams.find(p => p.value === test.difficulty);
        const timeRequiredParam = timeRequiredParams.find(p => p.value === test.time);
        if (!difficultyParam || !timeRequiredParam) {
            console.log(`❌ ${test.difficulty} × ${test.time}: Parameter not found`);
            continue;
        }
        const difficultyWeight = Number(difficultyParam.weight ?? difficultyParam.display_order ?? 1);
        const timeRequiredWeight = Number(timeRequiredParam.weight ?? timeRequiredParam.display_order ?? 1);
        const product = difficultyWeight * timeRequiredWeight;
        const division = product / factor;
        const rounded = Math.round(division);
        const final = Math.max(1, rounded);
        console.log(`${test.difficulty} × ${test.time}:`);
        console.log(`  Weights: ${difficultyWeight} × ${timeRequiredWeight} = ${product}`);
        console.log(`  Division: ${product} / ${factor} = ${division}`);
        console.log(`  Rounded: ${rounded}`);
        console.log(`  Final (min 1): ${final}`);
        console.log('');
    }
}
testCalculation()
    .then(() => {
    console.log('Done');
    process.exit(0);
})
    .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
//# sourceMappingURL=testPointsCalculation.js.map