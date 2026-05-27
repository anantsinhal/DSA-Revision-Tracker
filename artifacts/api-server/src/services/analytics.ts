import mongoose from "mongoose";
import { Question } from "../models/Question";
import { RevisionEvent } from "../models/RevisionEvent";

export async function getSummary(userId: string) {
  const totalProblems = await Question.countDocuments({ userId });
  const totalRevisions = await RevisionEvent.countDocuments({ userId });

  const today = new Date().toISOString().split("T")[0];
  const dueToday = await Question.countDocuments({
    userId,
    nextRevisionDate: { $lte: today },
  });

  // Calculate streak based on distinct active days continuously counting backwards
  const activityDays = await RevisionEvent.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$revisedAt" } },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  const activeDates = new Set(activityDays.map((d) => d._id));
  
  let streak = 0;
  const currentDate = new Date();
  
  // Strip time config safely
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayStr = currentDate.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let checkDate = new Date();
  
  // If user revised today OR yesterday, the streak exists. Otherwise 0.
  if (activeDates.has(todayStr)) {
    checkDate = new Date(); // Start checking backwards from today
  } else if (activeDates.has(yesterdayStr)) {
    checkDate = yesterday;  // Start checking backwards from yesterday
  } else {
    return { totalProblems, totalRevisions, dueToday, streak: 0 };
  }

  // Walk backwards day-by-day
  while (true) {
    const dStr = checkDate.toISOString().split("T")[0];
    if (activeDates.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { totalProblems, totalRevisions, dueToday, streak };
}

export async function getTopics(userId: string) {
  const topics = await Question.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: "$tags" },
    {
      $group: {
        _id: "$tags",
        averageConfidence: { $avg: "$confidenceLevel" },
        totalProblems: { $sum: 1 },
      },
    },
    {
      $project: {
        tag: "$_id",
        averageConfidence: 1,
        totalProblems: 1,
        _id: 0,
      },
    },
    { $sort: { totalProblems: -1 } },
  ]);

  return topics;
}

export async function getActivity(userId: string) {
  const activity = await RevisionEvent.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$revisedAt" } },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        date: "$_id",
        count: 1,
        _id: 0,
      },
    },
    { $sort: { date: 1 } },
  ]);

  return activity;
}
