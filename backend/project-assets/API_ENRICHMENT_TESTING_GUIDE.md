# API Enrichment Testing Guide

**Quick reference for testing all enhanced endpoints**

---

## 🧪 Test All Endpoints

### 1. Diocese Endpoint
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/dioceses?page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected in response:**
- `archdeaconryCount`: Number (e.g., 5)
- `churchCount`: Number (e.g., 32)

---

### 2. Archdeaconry Endpoint
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/archdeaconries?dioceseId=2&page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected in response:**
- Filtered by dioceseId=2 ✅
- `churchCount`: Number (e.g., 12)
- `currentLeadersCount`: Number (e.g., 8)

---

### 3. Church Endpoint
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/churches?archdeaconryId=14&page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected in response:**
- `diocese`: Object with id, name, code
- `currentLeadersCount`: Number (e.g., 5)

---

### 4. Fellowship Endpoint
```bash
curl -X GET "http://localhost:8080/api/v1/ds/org/fellowships?page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected in response:**
- `positionsCount`: Number (e.g., 15)

---

### 5. Position Title Endpoint
```bash
curl -X GET "http://localhost:8080/api/v1/ds/leadership/titles?page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected in response:**
- `usageCount`: Number (e.g., 8)

---

### 6. Fellowship Position Endpoint
```bash
curl -X GET "http://localhost:8080/api/v1/ds/leadership/positions?fellowshipId=382&page=0&size=20&sort=id,desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected in response:**
- `currentAssignmentsCount`: Number (e.g., 2)
- `availableSeats`: Number (e.g., 1)
- Calculate: `availableSeats = seats - currentAssignmentsCount`

---

## ✅ Validation Checklist

### For Each Endpoint:
- [ ] Returns 200 OK status
- [ ] Includes new count fields
- [ ] Counts are accurate (verify manually if possible)
- [ ] Pagination works (try page=1)
- [ ] Sorting works (try different sort fields)
- [ ] Search works (add &q=search_term where applicable)
- [ ] Response time < 500ms for page size 20

### Cross-Endpoint Validation:
- [ ] Diocese.churchCount = Sum of all Archdeaconry.churchCount in that diocese
- [ ] Archdeaconry filtering by dioceseId works correctly
- [ ] Church shows correct diocese information
- [ ] Fellowship Position availableSeats calculation is correct

---

## 🔍 Sample Test Scenarios

### Scenario 1: Empty Collections
Test with entities that have zero counts:
- Diocese with no archdeaconries → archdeaconryCount = 0
- Fellowship with no positions → positionsCount = 0
- Position with no assignments → currentAssignmentsCount = 0, availableSeats = seats

### Scenario 2: Full Capacity
Test with fully staffed positions:
- Position with seats=3, currentAssignmentsCount=3 → availableSeats = 0

### Scenario 3: Search & Filter
- Search dioceses by name: `?q=mukono`
- Filter archdeaconries by diocese: `?dioceseId=2`
- Filter positions by fellowship: `?fellowshipId=382`
- Filter positions by scope: `?fellowshipId=382&scope=DIOCESE`

---

## 🐛 Common Issues & Solutions

### Issue: Counts show as null
**Cause:** Using old `fromEntity()` method without counts  
**Solution:** Verify controller uses `listWithCounts()` and enriched fromEntity()

### Issue: Diocese filtering not working
**Cause:** Was a bug, should be fixed now  
**Solution:** Verify service uses `findByDioceseId()` not `findAll()`

### Issue: availableSeats is negative
**Cause:** More assignments than seats (data integrity issue)  
**Solution:** Check database for over-assigned positions

### Issue: Slow response times
**Cause:** Missing database indexes  
**Solution:** Check that all recommended indexes are created

---

## 📊 Performance Testing

### Test with Different Page Sizes
```bash
# Small page (fast)
curl "http://localhost:8080/api/v1/ds/org/dioceses?page=0&size=10"

# Default page (normal)
curl "http://localhost:8080/api/v1/ds/org/dioceses?page=0&size=20"

# Large page (slower but acceptable)
curl "http://localhost:8080/api/v1/ds/org/dioceses?page=0&size=50"
```

**Expected:**
- size=10: < 250ms
- size=20: < 500ms  
- size=50: < 1000ms

---

## 🎯 Quick Smoke Test Script

```bash
#!/bin/bash
TOKEN="YOUR_TOKEN_HERE"
BASE_URL="http://localhost:8080"

echo "Testing Diocese endpoint..."
curl -s "${BASE_URL}/api/v1/ds/org/dioceses?page=0&size=5" \
  -H "Authorization: Bearer ${TOKEN}" | grep -q "archdeaconryCount"
echo "✓ Diocese OK"

echo "Testing Archdeaconry endpoint..."
curl -s "${BASE_URL}/api/v1/ds/org/archdeaconries?dioceseId=2&page=0&size=5" \
  -H "Authorization: Bearer ${TOKEN}" | grep -q "churchCount"
echo "✓ Archdeaconry OK"

echo "Testing Church endpoint..."
curl -s "${BASE_URL}/api/v1/ds/org/churches?archdeaconryId=14&page=0&size=5" \
  -H "Authorization: Bearer ${TOKEN}" | grep -q "currentLeadersCount"
echo "✓ Church OK"

echo "Testing Fellowship endpoint..."
curl -s "${BASE_URL}/api/v1/ds/org/fellowships?page=0&size=5" \
  -H "Authorization: Bearer ${TOKEN}" | grep -q "positionsCount"
echo "✓ Fellowship OK"

echo "Testing Position Title endpoint..."
curl -s "${BASE_URL}/api/v1/ds/leadership/titles?page=0&size=5" \
  -H "Authorization: Bearer ${TOKEN}" | grep -q "usageCount"
echo "✓ Position Title OK"

echo "Testing Fellowship Position endpoint..."
curl -s "${BASE_URL}/api/v1/ds/leadership/positions?fellowshipId=382&page=0&size=5" \
  -H "Authorization: Bearer ${TOKEN}" | grep -q "availableSeats"
echo "✓ Fellowship Position OK"

echo ""
echo "🎉 All endpoints responding with enriched data!"
```

---

## 📝 Test Results Template

```
Date: _______________
Tester: _______________

Endpoint Test Results:
[ ] Diocese - archdeaconryCount: _____, churchCount: _____
[ ] Archdeaconry - churchCount: _____, currentLeadersCount: _____
[ ] Church - diocese: ✓/✗, currentLeadersCount: _____
[ ] Fellowship - positionsCount: _____
[ ] Position Title - usageCount: _____
[ ] Fellowship Position - currentAssignmentsCount: _____, availableSeats: _____

Performance:
- Average response time: _____ ms
- All under 500ms: ✓/✗

Issues Found:
_______________________________
_______________________________

Overall Status: PASS / FAIL
```

---

## 🚀 Ready for Production?

Before deploying to production:
- [ ] All 6 endpoints tested
- [ ] Counts are accurate
- [ ] Performance is acceptable
- [ ] Database indexes created
- [ ] Documentation reviewed
- [ ] No errors in logs
- [ ] Backward compatibility verified

**If all checked: Ready to deploy! 🎉**
