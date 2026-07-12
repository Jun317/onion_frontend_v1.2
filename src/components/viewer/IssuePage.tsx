import { memo, useCallback, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { IssueCard } from '@/data/types';
import { useIssue } from '@/data/useIssue';
import { categoryColor, tint } from '@/theme';

import { DetailPane } from './DetailPane';
import { IssueHero } from './IssueHero';

interface Props {
  card: IssueCard;
  isActive: boolean; // 현재±1 페이지만 상세 fetch
  width: number;
  height: number;
  onDetailOpenChange: (open: boolean) => void;
  onPressRelated: (id: string) => void;
}

/**
 * 이슈 한 개 = 가로 2페이지 [히어로 | 자세한 내용].
 * 자세한 내용(1페이지)으로 스냅되면 부모 세로 페이저를 잠가 제스처 충돌을 막는다.
 * Modal 시트 방식은 중첩 Modal(용어 해설) 충돌로 앱이 얼어 폐기 — v1 검증 구조로 복원.
 * 배경은 카테고리 색 7% 틴트.
 */
export const IssuePage = memo(function IssuePage({
  card,
  isActive,
  width,
  height,
  onDetailOpenChange,
  onPressRelated,
}: Props) {
  const { detail, error, retry } = useIssue(card.id, isActive);
  const pageRef = useRef(0);

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / width);
      if (page !== pageRef.current) {
        pageRef.current = page;
        onDetailOpenChange(page === 1);
      }
    },
    [width, onDetailOpenChange],
  );

  const background = tint(categoryColor(card.category), 0.07);

  return (
    <View style={{ width, height, backgroundColor: background }}>
      <ScrollView
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={styles.content}>
        <IssueHero card={card} detail={detail} width={width} />
        <DetailPane
          card={card}
          detail={detail}
          error={error}
          onRetry={retry}
          onPressRelated={onPressRelated}
          width={width}
        />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
});
