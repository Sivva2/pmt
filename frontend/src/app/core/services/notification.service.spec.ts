import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les notifications', () => {
    service.list().subscribe(list => expect(list).toHaveLength(2));
    const req = http.expectOne(`${environment.apiUrl}/notifications`);
    req.flush([
      { id: 1, taskId: 1, message: 'a', read: false, createdAt: '' },
      { id: 2, taskId: 2, message: 'b', read: true, createdAt: '' }
    ]);
  });

  it('met à jour le compteur non lu', () => {
    service.refreshUnreadCount().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/notifications/unread-count`);
    req.flush({ count: 5 });
    expect(service.unreadCount()).toBe(5);
  });

  it('marque une notification comme lue', () => {
    service.markAsRead(10).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/notifications/10/read`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});
