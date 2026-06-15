import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskCard from '../Tasks/TaskCard';

describe('TaskCard', () => {
  it('should render task title and points', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      description: 'Test description',
      type: 'video',
      points: 50,
    };

    render(<TaskCard task={task} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
  });
});
