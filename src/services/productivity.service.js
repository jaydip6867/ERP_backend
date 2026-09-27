import { Meeting } from '../models/meeting.model.js';
import { TodoTask } from '../models/todoTask.model.js';
import { CalendarEvent } from '../models/calendarEvent.model.js';
import { AppError } from '../utils/appError.js';

export class ProductivityService {
  /**
   * Schedule Meeting
   */
  static async createMeeting(data, userId) {
    const meeting_date = data.meeting_date || data.start_time || new Date();
    const meeting = await Meeting.create({
      ...data,
      meeting_date,
      organizer_id: data.organizer_id || userId,
      created_by: userId,
    });

    // Also auto-create Calendar Event
    await CalendarEvent.create({
      title: `Meeting: ${meeting.title}`,
      description: meeting.agenda,
      event_type: 'MEETING',
      start_time: meeting.meeting_date,
      end_time: new Date(new Date(meeting.meeting_date).getTime() + (meeting.duration_minutes || 60) * 60000),
      user_id: userId,
      location: meeting.location_or_link,
      color: '#4f46e5',
      created_by: userId,
    });

    return meeting;
  }

  /**
   * Update Minutes & convert Action Items to Todo Tasks
   */
  static async updateMeetingMinutes(meetingId, data, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw AppError.notFound('Meeting not found');

    if (data.minutes_of_meeting !== undefined) meeting.minutes_of_meeting = data.minutes_of_meeting;
    if (data.decisions_taken) meeting.decisions_taken = data.decisions_taken;
    if (data.status) meeting.status = data.status;

    if (data.action_items && Array.isArray(data.action_items)) {
      for (const item of data.action_items) {
        if (!item._id) {
          // New action item -> Auto create Todo task!
          const todo = await TodoTask.create({
            title: `Meeting Action: ${item.task_description}`,
            description: `Assigned during meeting '${meeting.title}'`,
            priority: 'HIGH',
            due_date: item.due_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            assigned_to: item.assigned_to,
            related_entity_type: 'Meeting',
            related_entity_id: meeting._id,
            status: 'TODO',
            created_by: userId,
          });

          meeting.action_items.push({
            task_description: item.task_description,
            assigned_to: item.assigned_to,
            due_date: item.due_date,
            is_created_as_todo: true,
            todo_task_id: todo._id,
          });
        }
      }
    }

    await meeting.save();
    return meeting;
  }

  /**
   * Todo Tasks Management
   */
  static async createTodoTask(data, userId) {
    const priority = (data.priority || 'MEDIUM').toUpperCase();
    const status = (data.status || 'TODO').toUpperCase();
    const todo = await TodoTask.create({
      ...data,
      priority,
      status,
      assigned_to: data.assigned_to || userId,
      created_by: userId,
    });

    // If task has a due date, put it on the calendar
    if (todo.due_date) {
      await CalendarEvent.create({
        title: `Task Due: ${todo.title}`,
        description: todo.description,
        event_type: 'TASK_DEADLINE',
        start_time: todo.due_date,
        end_time: new Date(new Date(todo.due_date).getTime() + 60 * 60000),
        user_id: todo.assigned_to,
        color: '#f59e0b',
        created_by: userId,
      });
    }

    return todo;
  }

  static async updateTodoStatus(taskId, status, userId) {
    const todo = await TodoTask.findById(taskId);
    if (!todo) throw AppError.notFound('Task not found');

    todo.status = status;
    if (status === 'DONE') {
      todo.completed_at = new Date();
    }
    await todo.save();
    return todo;
  }

  /**
   * Calendar Aggregator: Returns unified events for Month/Week/Day
   */
  static async getCalendarEvents({ startDate, endDate, userId } = {}) {
    const query = {};
    if (userId) query.user_id = userId;
    if (startDate || endDate) {
      query.start_time = {};
      if (startDate) query.start_time.$gte = new Date(startDate);
      if (endDate) query.start_time.$lte = new Date(endDate);
    }

    const events = await CalendarEvent.find(query).sort({ start_time: 1 });
    return events;
  }
}

export default ProductivityService;
