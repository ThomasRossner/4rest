import { getPool } from '../database/connection.js';
/**
 * Get aggregated survey analytics for a specific task or all survey tasks
 * All data is anonymized - no user information is included
 */
export async function getSurveyAnalytics(taskId) {
    const db = getPool();
    // Build query to get survey tasks and their responses
    let query = `
    SELECT 
      t.id as task_id,
      t.title as task_title,
      t.survey_questions,
      ut.survey_responses
    FROM tasks t
    INNER JOIN user_tasks ut ON t.id = ut.task_id
    WHERE t.type = 'survey'
      AND ut.survey_responses IS NOT NULL
  `;
    const params = [];
    if (taskId) {
        query += ` AND t.id = $1`;
        params.push(taskId);
    }
    query += ` ORDER BY t.id, ut.completed_at`;
    const result = await db.query(query, params);
    if (result.rows.length === 0) {
        return [];
    }
    // Group by task
    const taskMap = new Map();
    for (const row of result.rows) {
        const taskId = row.task_id;
        if (!taskMap.has(taskId)) {
            // Parse survey questions from task
            let questions = [];
            try {
                questions = typeof row.survey_questions === 'string'
                    ? JSON.parse(row.survey_questions)
                    : row.survey_questions || [];
            }
            catch (e) {
                console.error('Error parsing survey_questions:', e);
                questions = [];
            }
            taskMap.set(taskId, {
                taskId,
                taskTitle: row.task_title,
                responses: [],
                questions,
            });
        }
        // Parse survey responses
        let responses = [];
        try {
            const surveyResponses = typeof row.survey_responses === 'string'
                ? JSON.parse(row.survey_responses)
                : row.survey_responses;
            if (Array.isArray(surveyResponses)) {
                responses = surveyResponses;
            }
        }
        catch (e) {
            console.error('Error parsing survey_responses:', e);
        }
        taskMap.get(taskId).responses.push(responses);
    }
    // Aggregate responses for each task
    const analytics = [];
    for (const [taskId, taskData] of taskMap.entries()) {
        const questionMap = new Map();
        // Initialize question analytics from task questions
        for (const question of taskData.questions) {
            questionMap.set(question.id, {
                questionId: question.id,
                questionText: question.question || '',
                type: question.type || 'single_choice',
                responses: {},
            });
        }
        // Aggregate responses
        for (const responseArray of taskData.responses) {
            for (const response of responseArray) {
                if (!response.questionId || !response.answer) {
                    continue;
                }
                const questionAnalytics = questionMap.get(response.questionId);
                if (!questionAnalytics) {
                    continue;
                }
                const { type } = questionAnalytics;
                const answer = response.answer;
                if (type === 'single_choice') {
                    // Count each option
                    if (!questionAnalytics.responses.options) {
                        questionAnalytics.responses.options = {};
                    }
                    const option = String(answer);
                    questionAnalytics.responses.options[option] =
                        (questionAnalytics.responses.options[option] || 0) + 1;
                }
                else if (type === 'multiple_choice') {
                    // Count each selected option
                    if (!questionAnalytics.responses.options) {
                        questionAnalytics.responses.options = {};
                    }
                    if (Array.isArray(answer)) {
                        for (const option of answer) {
                            const optionStr = String(option);
                            questionAnalytics.responses.options[optionStr] =
                                (questionAnalytics.responses.options[optionStr] || 0) + 1;
                        }
                    }
                    else {
                        const optionStr = String(answer);
                        questionAnalytics.responses.options[optionStr] =
                            (questionAnalytics.responses.options[optionStr] || 0) + 1;
                    }
                }
                else if (type === 'rating') {
                    // Calculate rating statistics
                    const rating = typeof answer === 'number' ? answer : parseFloat(String(answer));
                    if (!isNaN(rating)) {
                        if (!questionAnalytics.responses.distribution) {
                            questionAnalytics.responses.distribution = {};
                        }
                        questionAnalytics.responses.distribution[rating] =
                            (questionAnalytics.responses.distribution[rating] || 0) + 1;
                        // Calculate average
                        const allRatings = Object.entries(questionAnalytics.responses.distribution)
                            .flatMap(([r, count]) => Array(count).fill(parseFloat(r)));
                        const sum = allRatings.reduce((acc, r) => acc + r, 0);
                        questionAnalytics.responses.average = sum / allRatings.length;
                    }
                }
                else if (type === 'text') {
                    // Only count responses, never store content
                    questionAnalytics.responses.responseCount =
                        (questionAnalytics.responses.responseCount || 0) + 1;
                }
            }
        }
        analytics.push({
            taskId: taskData.taskId,
            taskTitle: taskData.taskTitle,
            totalResponses: taskData.responses.length,
            questions: Array.from(questionMap.values()),
        });
    }
    return analytics;
}
//# sourceMappingURL=survey.service.js.map