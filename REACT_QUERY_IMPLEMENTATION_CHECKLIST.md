# React Query Implementation Checklist

## Installation & Setup

- [ ] Install React Query
  ```bash
  npm install @tanstack/react-query
  ```

- [ ] Files already created:
  - [x] `lib/query-client.ts` - Query client configuration
  - [x] `providers/QueryProvider.tsx` - Provider component
  - [x] `hooks/useClasses.ts` - Classes hooks
  - [x] `hooks/useTeachers.ts` - Teachers hooks
  - [x] `hooks/useSubjects.ts` - Subjects hooks
  - [x] `hooks/useStudents.ts` - Students hooks

## Layout Updates

- [ ] Update `school-app/app/layout.tsx`
  ```typescript
  import { QueryProvider } from '@/providers/QueryProvider';
  
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          <QueryProvider>
            {children}
          </QueryProvider>
        </body>
      </html>
    );
  }
  ```

- [ ] Update `school-app/app/admin/layout.tsx`
  ```typescript
  import { QueryProvider } from '@/providers/QueryProvider';
  
  export default function AdminLayout({ children }) {
    return (
      <QueryProvider>
        {children}
      </QueryProvider>
    );
  }
  ```

- [ ] Update `school-app/app/teacher/layout.tsx` (if exists)

- [ ] Update `school-app/app/student/layout.tsx` (if exists)

## Page Migration

### Admin Pages

- [ ] `/admin/classes` - Replace with `useClasses()`
- [ ] `/admin/teachers` - Replace with `useTeachers()`
- [ ] `/admin/subjects` - Replace with `useSubjects()`
- [ ] `/admin/students` - Replace with `useStudents()`
- [ ] `/admin/exams` - Create `useExams()` hook
- [ ] `/admin/results` - Create `useResults()` hook
- [ ] `/admin/attendance` - Create `useAttendance()` hook
- [ ] `/admin/timetable` - Create `useTimetable()` hook

### Teacher Pages

- [ ] `/teacher/classes` - Replace with `useClasses()`
- [ ] `/teacher/students` - Replace with `useStudents()`
- [ ] `/teacher/exams` - Replace with `useExams()`
- [ ] `/teacher/results` - Replace with `useResults()`
- [ ] `/teacher/attendance` - Replace with `useAttendance()`

### Student Pages

- [ ] `/student/classes` - Replace with `useClasses()`
- [ ] `/student/exams` - Replace with `useExams()`
- [ ] `/student/results` - Replace with `useResults()`
- [ ] `/student/attendance` - Replace with `useAttendance()`

## Component Updates

### List Components

- [ ] Update all list components to use hooks
  ```typescript
  const { data, isLoading, error } = useClasses();
  ```

### Form Components

- [ ] Update all form components to use mutations
  ```typescript
  const { mutate, isPending } = useCreateClass();
  ```

### Detail Components

- [ ] Update all detail components to use single item hooks
  ```typescript
  const { data, isLoading } = useClass(id);
  ```

## Testing

- [ ] Test classes page loads without reload
- [ ] Test creating a class (no page reload)
- [ ] Test updating a class (no page reload)
- [ ] Test deleting a class (no page reload)
- [ ] Test switching between pages (data cached)
- [ ] Test going back to page (data from cache)
- [ ] Test error handling
- [ ] Test loading states

## Performance Verification

- [ ] Open DevTools Network tab
- [ ] Create a class
  - [ ] Verify only 1 POST request
  - [ ] Verify GET request for refetch
  - [ ] Verify no page reload

- [ ] Switch pages
  - [ ] Verify data loads from cache
  - [ ] Verify no API call if data fresh

- [ ] Go back to previous page
  - [ ] Verify data loads instantly from cache
  - [ ] Verify no API call

## DevTools Setup (Optional)

- [ ] Install DevTools
  ```bash
  npm install @tanstack/react-query-devtools
  ```

- [ ] Add to layout
  ```typescript
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
  
  <QueryProvider>
    {children}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryProvider>
  ```

- [ ] Open DevTools to monitor queries

## Additional Hooks to Create

- [ ] `useExams()` - Exams CRUD
- [ ] `useResults()` - Results CRUD
- [ ] `useAttendance()` - Attendance CRUD
- [ ] `useTimetable()` - Timetable CRUD
- [ ] `useAcademicYears()` - Academic years CRUD
- [ ] `useFees()` - Fees CRUD
- [ ] `useAnnouncements()` - Announcements CRUD
- [ ] `useEvents()` - Events CRUD
- [ ] `useLiveClasses()` - Live classes CRUD
- [ ] `useHomework()` - Homework CRUD

## Configuration Adjustments

- [ ] Adjust `staleTime` if needed
  ```typescript
  staleTime: 5 * 60 * 1000,  // 5 minutes
  ```

- [ ] Adjust `gcTime` if needed
  ```typescript
  gcTime: 10 * 60 * 1000,  // 10 minutes
  ```

- [ ] Adjust `retry` if needed
  ```typescript
  retry: 1,  // Retry once
  ```

## Documentation

- [ ] Update README with React Query info
- [ ] Document custom hooks
- [ ] Document migration guide
- [ ] Document best practices

## Deployment

- [ ] Test in staging environment
- [ ] Monitor API calls
- [ ] Monitor performance
- [ ] Deploy to production
- [ ] Monitor production performance

## Performance Metrics

### Before React Query
- [ ] API calls per page load: ___
- [ ] Page load time: ___ ms
- [ ] Time to interactive: ___ ms

### After React Query
- [ ] API calls per page load: ___
- [ ] Page load time: ___ ms
- [ ] Time to interactive: ___ ms

### Expected Improvement
- [ ] 50-70% fewer API calls
- [ ] 30-50% faster page loads
- [ ] Instant navigation between cached pages

## Troubleshooting

- [ ] Data not updating?
  - [ ] Check if query is invalidated on mutation
  - [ ] Check if mutation onSuccess is called

- [ ] Too many API calls?
  - [ ] Increase staleTime
  - [ ] Check for duplicate queries

- [ ] Stale data?
  - [ ] Decrease staleTime
  - [ ] Manually refetch when needed

- [ ] Memory issues?
  - [ ] Decrease gcTime
  - [ ] Check for memory leaks

## Sign-Off

- [ ] All pages migrated
- [ ] All tests passing
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Ready for production

---

## Quick Reference

### Install
```bash
npm install @tanstack/react-query
```

### Wrap App
```typescript
<QueryProvider>
  {children}
</QueryProvider>
```

### Use Hook
```typescript
const { data, isLoading } = useClasses();
```

### Create Mutation
```typescript
const { mutate } = useCreateClass();
mutate(data);
```

### Invalidate Cache
```typescript
queryClient.invalidateQueries({ queryKey: QUERY_KEY });
```

---

**Status**: Ready to implement
**Estimated Time**: 2-4 hours
**Expected Benefit**: 50-70% fewer API calls, faster pages, better UX
