# DbContext Threading Issue Report

## ปัญหาที่พบ

**Error Message:**
```
"A second operation was started on this context instance before a previous operation completed. This is usually caused by different threads concurrently using the same instance of DbContext. For more information on how to avoid threading issues with DbContext, see https://go.microsoft.com/fwlink/?linkid=2097913."
```

## สาเหตุ

ปัญหานี้เกิดจากการที่ .NET API ใช้ DbContext instance เดียวกันในหลาย threads พร้อมกัน ซึ่งมักเกิดขึ้นเมื่อมี:

1. **Concurrent API calls** - เช่น การ cancel flight พร้อมกับการ fetch flight list
2. **Shared DbContext** - ใช้ DbContext เดียวกันใน multiple requests
3. **Async operations** - Operations ที่ทำงานแบบ asynchronous โดยไม่มี proper synchronization

## วิธีแก้ไขที่แนะนำสำหรับ Backend (.NET)

### 1. ใช้ Scoped DbContext (แนะนำ)
```csharp
// ใน Program.cs หรือ Startup.cs
services.AddDbContext<YourDbContext>(options =>
    options.UseSqlServer(connectionString), ServiceLifetime.Scoped);
```

### 2. ใช้ DbContext Factory
```csharp
// Register factory
services.AddDbContextFactory<YourDbContext>(options =>
    options.UseSqlServer(connectionString));

// ใช้งานใน Controller
public class FlightController : ControllerBase
{
    private readonly IDbContextFactory<YourDbContext> _contextFactory;
    
    public FlightController(IDbContextFactory<YourDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }
    
    public async Task<IActionResult> GetFlights()
    {
        using var context = _contextFactory.CreateDbContext();
        // ใช้ context ที่แยกต่างหาก
        var flights = await context.Flights.ToListAsync();
        return Ok(flights);
    }
}
```

### 3. ใช้ Repository Pattern
```csharp
public interface IFlightRepository
{
    Task<List<Flight>> GetFlightsAsync();
    Task<bool> CancelFlightAsync(int flightId);
}

public class FlightRepository : IFlightRepository
{
    private readonly IDbContextFactory<YourDbContext> _contextFactory;
    
    public FlightRepository(IDbContextFactory<YourDbContext> contextFactory)
    {
        _contextFactory = contextFactory;
    }
    
    public async Task<List<Flight>> GetFlightsAsync()
    {
        using var context = _contextFactory.CreateDbContext();
        return await context.Flights.ToListAsync();
    }
    
    public async Task<bool> CancelFlightAsync(int flightId)
    {
        using var context = _contextFactory.CreateDbContext();
        var flight = await context.Flights.FindAsync(flightId);
        if (flight != null)
        {
            flight.Status = "Cancelled";
            await context.SaveChangesAsync();
            return true;
        }
        return false;
    }
}
```

### 4. Avoid Sharing DbContext
```csharp
// ❌ อย่าทำแบบนี้
public class BadService
{
    private readonly YourDbContext _context; // Shared context
    
    public async Task Method1() => await _context.Flights.ToListAsync();
    public async Task Method2() => await _context.SaveChangesAsync();
}

// ✅ ทำแบบนี้แทน
public class GoodService
{
    private readonly IDbContextFactory<YourDbContext> _factory;
    
    public async Task Method1()
    {
        using var context = _factory.CreateDbContext();
        return await context.Flights.ToListAsync();
    }
    
    public async Task Method2()
    {
        using var context = _factory.CreateDbContext();
        return await context.SaveChangesAsync();
    }
}
```

## การปรับแต่งที่ทำใน Frontend

เพื่อลดความเป็นไปได้ของ concurrent operations ใน frontend:

### 1. เพิ่ม delay ใน query invalidation
```typescript
// useCancelFlightMutation.ts
onSuccess: (data, variables) => {
  toast.success(data.message || "Flight cancelled successfully");
  
  // เพิ่ม delay เพื่อหลีกเลี่ยง concurrent operations
  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ["flightList"] });
  }, 100);
}
```

### 2. ปรับ React Query options
```typescript
// useFlightListQuery.ts
export function useFlightListQuery(params: GetFlightListParams) {
  return useQuery({
    queryKey: ['flightList', params],
    queryFn: () => getFlightList(params),
    // ป้องกัน concurrent queries
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount) => failureCount < 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

### 3. ใช้ useCallback เพื่อลด re-renders
```typescript
// page.tsx
const handleFilterChange = useCallback((newFilters: FilterParams) => {
  setFilters(newFilters);
  setPagination(prev => ({ ...prev, page: 1 }));
}, []);
```

## ลำดับความสำคัญในการแก้ไข

1. **High Priority** - ใช้ DbContextFactory หรือ Scoped DbContext
2. **Medium Priority** - ปรับ Repository Pattern
3. **Low Priority** - Frontend optimizations (ทำแล้ว)

## การทดสอบ

หลังจากแก้ไข backend แล้ว ควรทดสอบ:

1. ✅ Cancel flight พร้อมกับ refresh flight list
2. ✅ Multiple users ใช้งานพร้อมกัน
3. ✅ High-concurrency scenarios
4. ✅ Load testing

## อ้างอิง

- [Entity Framework Core Thread Safety](https://docs.microsoft.com/en-us/ef/core/miscellaneous/thread-safety)
- [DbContext Factory Pattern](https://docs.microsoft.com/en-us/ef/core/miscellaneous/configuring-dbcontext#using-a-dbcontext-factory)
- [Dependency Injection in .NET](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection)

---
**หมายเหตุ:** Frontend optimizations ทำเสร็จแล้ว แต่ยังต้องแก้ไข backend เพื่อแก้ปัญหาต้นตอ