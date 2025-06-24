
# 성능 최적화 가이드

이 문서는 대용량 데이터셋(10,000개 이상의 디바이스)을 효율적으로 처리하기 위해 적용된 성능 최적화 기법들을 설명합니다.

## 목차
1. [디바운싱 (Debouncing)](#디바운싱-debouncing)
2. [메모이제이션 (Memoization)](#메모이제이션-memoization)
3. [검색 인덱스 (Search Index)](#검색-인덱스-search-index)
4. [필터링 순서 최적화](#필터링-순서-최적화)
5. [콜백 최적화](#콜백-최적화)
6. [페이지네이션](#페이지네이션)
7. [성능 측정](#성능-측정)

## 디바운싱 (Debouncing)

### 개념
디바운싱은 연속적으로 발생하는 이벤트(예: 타이핑)를 지연시켜 마지막 이벤트만 처리하는 기법입니다.

### 언제 사용하는가?
- 검색 입력 필드
- API 호출 최적화
- 윈도우 리사이즈 이벤트
- 스크롤 이벤트

### 우리 프로젝트에서의 활용
```typescript
// DebouncedInput 컴포넌트
const DebouncedInput = ({ value, onChange, debounceMs = 300 }) => {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);
    
    return () => clearTimeout(timeoutRef);
  }, [localValue, onChange, debounceMs]);
};
```

### 장점
- **사용자 경험 향상**: 타이핑 중 버벅임 없음
- **성능 개선**: 불필요한 연산 감소
- **서버 부하 감소**: API 호출 횟수 최소화

### 단점
- **지연 시간**: 결과 표시까지 약간의 지연
- **복잡성**: 추가적인 상태 관리 필요

## 메모이제이션 (Memoization)

### 개념
이전에 계산한 결과를 저장해두고, 같은 입력에 대해서는 저장된 결과를 반환하는 최적화 기법입니다.

### React에서의 메모이제이션 도구
- `useMemo`: 값의 메모이제이션
- `useCallback`: 함수의 메모이제이션
- `memo`: 컴포넌트의 메모이제이션

### 우리 프로젝트에서의 활용

#### 1. 검색어 메모이제이션
```typescript
const memoizedSearchQuery = useMemo(() => 
  searchQuery.toLowerCase().trim(), 
  [searchQuery]
);
```

#### 2. 디바이스 타입 계산 메모이제이션
```typescript
const deviceTypes = useMemo(() => {
  const types = new Set<DeviceTypeValue>();
  devices.forEach(device => {
    if (device.type) {
      types.add(device.type as DeviceTypeValue);
    }
  });
  return Array.from(types);
}, [devices]);
```

#### 3. 사용자 맵 메모이제이션
```typescript
const userIdToNameMap = useMemo(() => {
  const map = new Map<string, string>();
  users.forEach(user => {
    if (user.id) {
      map.set(String(user.id), user.name || '');
    }
  });
  return map;
}, [users]);
```

### 언제 사용하는가?
- **비용이 큰 계산**: 복잡한 연산이나 데이터 변환
- **의존성이 적은 값**: 자주 변경되지 않는 데이터
- **자식 컴포넌트에 전달되는 props**: 불필요한 리렌더링 방지

### 주의사항
- **과도한 사용 금지**: 모든 값을 메모이제이션하면 오히려 성능 저하
- **의존성 배열 관리**: 잘못된 의존성은 버그의 원인
- **메모리 사용량**: 캐시된 값들이 메모리를 차지

## 검색 인덱스 (Search Index)

### 개념
검색 가능한 모든 텍스트를 미리 합쳐서 저장해두는 기법입니다.

### 우리 프로젝트에서의 구현
```typescript
const searchIndex = useMemo(() => {
  const index = new Map<string, string>();
  devices.forEach(device => {
    const ownerId = String(device.assignedTo || device.assignedToId || '');
    const ownerName = userIdToNameMap.get(ownerId) || '';
    
    const searchableText = [
      device.project || '',
      device.projectGroup || '',
      device.type || '',
      device.serialNumber || '',
      device.imei || '',
      device.notes || '',
      ownerName
    ].join(' ').toLowerCase();
    
    index.set(device.id, searchableText);
  });
  return index;
}, [devices, userIdToNameMap]);
```

### 장점
- **검색 속도 향상**: 미리 준비된 텍스트로 빠른 검색
- **일관성**: 모든 검색 가능한 필드를 한 번에 처리
- **정규화**: 소문자 변환, 공백 처리 등을 미리 수행

### 언제 사용하는가?
- **대용량 데이터 검색**: 수천 개 이상의 레코드
- **복합 필드 검색**: 여러 필드를 동시에 검색해야 할 때
- **빈번한 검색**: 사용자가 자주 검색하는 화면

## 필터링 순서 최적화

### 개념
가장 선택적인(결과를 많이 줄이는) 필터를 먼저 적용하여 후속 필터의 처리량을 줄이는 기법입니다.

### 우리 프로젝트에서의 적용
```typescript
// 1. 상태 필터 (가장 선택적)
if (effectiveStatusFilters && effectiveStatusFilters.length > 0) {
  filtered = filtered.filter(device => 
    device.status && effectiveStatusFilters.includes(device.status)
  );
}

// 2. 타입 필터
if (typeFilter !== 'all') {
  filtered = filtered.filter(device => device.type === typeFilter);
}

// 3. 검색 필터 (가장 마지막)
if (memoizedSearchQuery) {
  filtered = filtered.filter(device => {
    const searchableText = searchIndex.get(device.id) || '';
    return searchableText.includes(memoizedSearchQuery);
  });
}
```

### 원칙
1. **카디널리티 순서**: 고유값이 적은 필드부터 (상태 > 타입 > 검색)
2. **선택성 우선**: 더 많은 항목을 제외하는 필터를 먼저
3. **비용 고려**: 계산 비용이 높은 필터는 나중에

## 콜백 최적화

### useCallback 사용법
```typescript
const handleSearchChange = useCallback((query: string) => {
  setSearchQuery(query);
}, []);

const handleSortChange = useCallback((field: string) => {
  if (onSortChange) {
    const sortValue = field === 'none' ? 'none' : `${field}-${sortOrder}`;
    onSortChange(sortValue);
  }
}, [onSortChange, sortOrder]);
```

### 언제 사용하는가?
- **자식 컴포넌트에 전달되는 함수**: props로 전달되는 콜백
- **useEffect의 의존성**: 무한 루프 방지
- **이벤트 핸들러**: 자주 호출되는 함수

### 주의사항
- **의존성 배열 정확성**: 모든 사용된 변수를 포함
- **과도한 사용 금지**: 단순한 함수는 useCallback 불필요

## 페이지네이션

### 가상화 vs 페이지네이션
- **가상화**: 화면에 보이는 항목만 렌더링 (react-window, react-virtualized)
- **페이지네이션**: 일정 개수씩 나누어 표시

### 우리 프로젝트에서의 구현
```typescript
const pagination = usePagination({
  totalItems: filteredDevices.length,
  itemsPerPage: filteredDevices.length > 1000 ? 50 : 20,
  initialPage: 1
});

const paginatedDevices = useMemo(() => {
  return filteredDevices.slice(pagination.startIndex, pagination.endIndex);
}, [filteredDevices, pagination.startIndex, pagination.endIndex]);
```

### 동적 페이지 크기
- **1000개 미만**: 20개씩 표시
- **1000개 이상**: 50개씩 표시 (대용량 데이터셋 최적화)

## 성능 측정

### 개발 중 성능 모니터링
```typescript
console.time('Device filtering');
// 필터링 로직
console.timeEnd('Device filtering');
console.log(`Filtered ${devices.length} -> ${filtered.length} devices`);
```

### React DevTools Profiler
1. **컴포넌트 렌더링 시간** 측정
2. **리렌더링 원인** 파악
3. **메모이제이션 효과** 확인

### 성능 지표
- **필터링 시간**: 10,000개 데이터 기준 < 100ms
- **타이핑 반응성**: 입력 지연 < 16ms (60fps)
- **페이지 로딩**: 초기 렌더링 < 1초

## Best Practices

### 1. 점진적 최적화
```typescript
// 단계적 접근
1. 기본 구현 → 2. 프로파일링 → 3. 병목 지점 최적화 → 4. 재측정
```

### 2. 메모리 vs 속도 트레이드오프
- **메모리 사용량 모니터링**: 캐시로 인한 메모리 증가 주의
- **적절한 캐시 크기**: 너무 많은 데이터 캐싱 방지

### 3. 사용자 경험 우선
- **체감 성능**: 실제 성능보다 사용자가 느끼는 속도가 중요
- **피드백 제공**: 로딩 상태, 진행률 표시

### 4. 환경별 최적화
```typescript
// 개발 환경에서만 성능 측정
if (process.env.NODE_ENV === 'development') {
  console.time('filtering');
}
```

## 결론

대용량 데이터 처리에서는 단일 기법보다는 **여러 최적화 기법을 조합**하는 것이 효과적입니다:

1. **디바운싱**으로 입력 반응성 개선
2. **메모이제이션**으로 중복 계산 방지  
3. **검색 인덱스**로 검색 속도 향상
4. **필터 순서 최적화**로 처리량 감소
5. **페이지네이션**으로 렌더링 부담 감소

각 기법은 상황에 맞게 선택적으로 적용하되, **과도한 최적화는 오히려 코드 복잡성을 증가**시킬 수 있으므로 성능 측정을 통해 실제 효과를 확인하는 것이 중요합니다.
