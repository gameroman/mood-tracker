import { DEFAULT_MOODS } from "./constants";
import { fetch$ } from "./db";

export function moodInfo(pleasantness: number, energy: number, moods = DEFAULT_MOODS) {
  const moodRow =
    energy >= 0.67
      ? 0
      : energy >= 0.33
        ? 1
        : energy >= 0
          ? 2
          : energy >= -0.33
            ? 3
            : energy >= -0.67
              ? 4
              : 5;

  const moodColumn =
    pleasantness >= 0.67
      ? 0
      : pleasantness >= 0.33
        ? 1
        : pleasantness >= 0
          ? 2
          : pleasantness >= -0.33
            ? 3
            : pleasantness >= -0.67
              ? 4
              : 5;

  return moods[moodRow * 6 + moodColumn];
}

export async function fetchMood(user) {
  const mood = await fetch$("select * from mood where user_id=$1 order by id desc limit 1", [
    user.id,
  ]);

  return mood
    ? {
        status: moodInfo(
          mood.pleasantness,
          mood.energy,
          user.custom_labels?.length ? user.custom_labels : DEFAULT_MOODS,
        ),
        pleasantness: mood.pleasantness,
        energy: mood.energy,
        timestamp: mood.timestamp,
      }
    : {
        status: "-",
        pleasantness: 0,
        energy: 0,
        timestamp: null,
      };
}
