import { describe, expect, it } from 'vitest';
import { filterExecutableTasks } from './executableTasks';

const baseTask = {
  id: 'task-1',
  title: 'Test',
  completed: false,
  is_available: true,
  verification_status: null as string | null,
};

describe('filterExecutableTasks', () => {
  it('excludes completed, locked and pending tasks', () => {
    const tasks = [
      { ...baseTask, id: 'open', location: { id: '1', name: 'Online', is_online: true } },
      { ...baseTask, id: 'done', completed: true, location: { id: '1', name: 'Online', is_online: true } },
      { ...baseTask, id: 'locked', is_available: false, location: { id: '1', name: 'Online', is_online: true } },
      { ...baseTask, id: 'pending', verification_status: 'pending', location: { id: '1', name: 'Online', is_online: true } },
    ];

    expect(filterExecutableTasks(tasks).map((task) => task.id)).toEqual(['open']);
  });

  it('includes location-independent tasks without geolocation', () => {
    const tasks = [
      {
        ...baseTask,
        location: { id: 'online-1', name: 'Online', is_online: true },
      },
      {
        ...baseTask,
        id: 'task-2',
        location: {
          id: 'place-1',
          name: 'Hotel',
          is_online: false,
          latitude: 52.52,
          longitude: 13.405,
        },
      },
    ];

    expect(filterExecutableTasks(tasks).map((task) => task.id)).toEqual(['task-1']);
  });

  it('includes nearby physical tasks when user location is known', () => {
    const tasks = [
      {
        ...baseTask,
        location: {
          id: 'place-1',
          name: 'Hotel',
          is_online: false,
          latitude: 52.5201,
          longitude: 13.4051,
        },
      },
      {
        ...baseTask,
        id: 'task-far',
        location: {
          id: 'place-2',
          name: 'Far away',
          is_online: false,
          latitude: 48.137,
          longitude: 11.575,
        },
      },
    ];

    expect(
      filterExecutableTasks(tasks, {
        userLocation: { lat: 52.52, lng: 13.405 },
      }).map((task) => task.id)
    ).toEqual(['task-1']);
  });
});
