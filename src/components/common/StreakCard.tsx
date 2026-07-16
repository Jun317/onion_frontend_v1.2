import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { copy } from '@/constants/copy';
import { ATTENDANCE_GOAL, dateKey, usePrefs } from '@/lib/store';
import { font, radius, spacing, typography, useTheme } from '@/theme';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 출석 스트릭 카드 — "🔥 N일 연속" + 최근 7일 도트.
 * 하루 ATTENDANCE_GOAL 개 이슈를 읽으면 출석 — 읽기가 곧 출석 (뉴스앱 본질과 정렬).
 */
export function StreakCard() {
  const { theme } = useTheme();
  const { attendance, streak } = usePrefs();
  const attended = new Set(attendance);

  const DAY = 24 * 60 * 60_000;
  const now = Date.now();
  // 최근 7일 (오늘이 맨 오른쪽)
  const days = Array.from({ length: 7 }, (_, i) => {
    const ms = now - (6 - i) * DAY;
    return { key: dateKey(ms), label: WEEKDAY_LABELS[new Date(ms).getDay()] };
  });

  return (
    <Card style={styles.card}>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: theme.text }]}>{copy.streakTitle(streak)}</Text>
        <Text style={[styles.hint, { color: theme.textMuted }]}>
          {copy.streakHint(ATTENDANCE_GOAL)}
        </Text>
      </View>
      <View style={styles.dots}>
        {days.map((d) => {
          const on = attended.has(d.key);
          return (
            <View
              key={d.key}
              style={[
                styles.dot,
                { backgroundColor: on ? theme.accent : theme.hairline },
              ]}>
              <Text style={[styles.dotLabel, { color: on ? theme.onAccent : theme.textMuted }]}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  textCol: { gap: 2 },
  title: { fontSize: 16, ...font(800) },
  hint: { ...typography.micro },
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: {
    width: 26,
    height: 26,
    borderRadius: radius.control / 2 + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: { fontSize: 10, ...font(600) },
});
