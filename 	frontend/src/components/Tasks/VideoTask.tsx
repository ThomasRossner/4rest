import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../../services/api';
import './TaskComponents.css';

interface VideoTaskProps {
  taskId: string;
  onComplete?: () => void;
}

export function VideoTask({ taskId, onComplete }: VideoTaskProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery(
    ['task', taskId],
    () => api.getTask(taskId),
    { enabled: !!taskId }
  );

  const completeMutation = useMutation(
    (data: { quiz_answers: any }) => api.completeTask(taskId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
        onComplete?.();
      },
    }
  );

  if (isLoading) return <div>Loading task...</div>;
  if (!task) return <div>Task not found</div>;

  const questions = task.quiz_questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const allAnswered = questions.every((_: any, index: number) => answers[index]);

  const handleAnswer = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = () => {
    if (allAnswered) {
      completeMutation.mutate({
        quiz_answers: Object.entries(answers).map(([index, answer]) => ({
          questionIndex: parseInt(index),
          answer,
        })),
      });
    }
  };

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>{task.title}</h2>
        <span className="task-points">+{task.points} points</span>
      </div>

      {task.video_url && (
        <div className="video-container">
          <video
            controls
            src={task.video_url}
            className="task-video"
            onEnded={() => {
              // Video ended, show quiz questions
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <div className="quiz-container">
        <h3>Quiz Questions</h3>
        <div className="question-progress">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>

        {currentQuestion && (
          <div className="question-card">
            <p className="question-text">{currentQuestion.question}</p>
            <div className="answer-options">
              {currentQuestion.options.map((option: string, optionIndex: number) => (
                <button
                  key={optionIndex}
                  className={`answer-button ${
                    answers[currentQuestionIndex] === option ? 'selected' : ''
                  }`}
                  onClick={() => handleAnswer(currentQuestionIndex, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="quiz-navigation">
          <button
            onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </button>
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              disabled={!answers[currentQuestionIndex]}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || completeMutation.isLoading}
              className="submit-button"
            >
              {completeMutation.isLoading ? 'Submitting...' : 'Complete Task'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
