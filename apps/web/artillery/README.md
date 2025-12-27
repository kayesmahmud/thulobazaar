# Artillery Load Testing

Load and performance testing for ThulobBazaar using [Artillery](https://www.artillery.io/).

## Prerequisites

Install Artillery globally:

```bash
npm install -g artillery
```

Or use npx (no installation needed):

```bash
npx artillery --version
```

## Test Configurations

### 1. Smoke Test (`smoke-test.yml`)

Quick health check to verify basic functionality.

```bash
# Run smoke test
npx artillery run artillery/smoke-test.yml
```

- Duration: 10 seconds
- Rate: 1 user/second
- Purpose: Verify deployment is working

### 2. Load Test (`load-test.yml`)

Standard load test simulating realistic traffic patterns.

```bash
# Run load test
npx artillery run artillery/load-test.yml
```

- Duration: ~4 minutes
- Peak: 20 users/second
- Phases: Warm up → Ramp up → Sustained → Cool down

**Traffic Distribution:**
- 60% - Homepage & browsing
- 20% - Search flow
- 15% - Ad detail views
- 5% - Category browsing

### 3. Stress Test (`api-stress.yml`)

High-load test to find breaking points.

```bash
# Run stress test
npx artillery run artillery/api-stress.yml
```

- Duration: ~2.5 minutes
- Peak: 100 users/second
- Purpose: Find system limits

## Running Tests

### Basic Run

```bash
# Smoke test (quick verification)
npm run test:load:smoke

# Standard load test
npm run test:load

# Stress test
npm run test:load:stress
```

### With HTML Report

```bash
# Generate detailed HTML report
npx artillery run artillery/load-test.yml --output report.json
npx artillery report report.json
```

### Against Different Environments

```bash
# Production
npx artillery run artillery/smoke-test.yml --target https://thulobazaar.com

# Staging
npx artillery run artillery/load-test.yml --target https://staging.thulobazaar.com
```

## Performance Thresholds

### Smoke Test
- Max error rate: 0%
- p99 response time: < 1s

### Load Test
- Max error rate: 5%
- p99 response time: < 2s

### Stress Test
- Max error rate: 10%
- p95 response time: < 3s
- p99 response time: < 5s

## Interpreting Results

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `http.response_time.p50` | Median response time | < 200ms |
| `http.response_time.p95` | 95th percentile | < 1s |
| `http.response_time.p99` | 99th percentile | < 2s |
| `http.codes.2xx` | Successful responses | > 95% |
| `http.codes.5xx` | Server errors | < 1% |
| `vusers.completed` | Completed user sessions | > 95% |

### Example Output

```
--------------------------------
Summary report @ 14:30:00(+0545)
--------------------------------

http.codes.200: ................................................ 2500
http.request_rate: ............................................. 20/sec
http.requests: ................................................. 2500
http.response_time:
  min: ......................................................... 45
  max: ......................................................... 890
  median: ...................................................... 120
  p95: ......................................................... 350
  p99: ......................................................... 550
vusers.completed: .............................................. 500
vusers.created: ................................................ 500
vusers.created_by_name.Browse Homepage: ........................ 300
vusers.created_by_name.Search Ads: ............................. 100
vusers.created_by_name.View Ad Details: ........................ 75
vusers.created_by_name.Browse Categories: ...................... 25
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run smoke test
  run: |
    npm install -g artillery
    artillery run artillery/smoke-test.yml --target ${{ secrets.STAGING_URL }}
```

## Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure the target server is running
   - Check if the port is correct (default: 3333)

2. **High error rate**
   - Check server logs for errors
   - Reduce arrival rate
   - Check database connection pool

3. **Slow response times**
   - Check for N+1 queries
   - Review database indexes
   - Check for memory leaks

### Debug Mode

```bash
# Run with debug output
DEBUG=artillery:* npx artillery run artillery/smoke-test.yml
```

## Customization

### Adding Authentication

For authenticated endpoints, add a `beforeScenario` hook:

```yaml
config:
  processor: "./auth-functions.js"

scenarios:
  - name: "Authenticated flow"
    beforeScenario: "getAuthToken"
    flow:
      - get:
          url: "/api/ads/my-ads"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

### Custom Metrics

```yaml
config:
  plugins:
    metrics-by-endpoint:
      useOnlyRequestNames: true
```

---

*For more information, see [Artillery Documentation](https://www.artillery.io/docs)*
