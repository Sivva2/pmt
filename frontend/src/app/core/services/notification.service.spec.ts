import { of } from 'rxjs';
import { setInjectMock } from '../../../__mocks__/angular-core';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockHttp: any;

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    setInjectMock(() => mockHttp);
    service = new NotificationService();
  });

  it('liste les notifications', (done) => {
    mockHttp.get.mockReturnValue(of([{ id: 1 }, { id: 2 }]));
    service.list().subscribe((list: any) => {
      expect(list).toHaveLength(2);
      done();
    });
  });

  it('met à jour le compteur non lu', (done) => {
    mockHttp.get.mockReturnValue(of({ count: 5 }));
    service.refreshUnreadCount().subscribe((r: any) => {
      expect(r.count).toBe(5);
      expect(service.unreadCount()).toBe(5);
      done();
    });
  });

  it('marque une notification comme lue', (done) => {
    mockHttp.put.mockReturnValue(of(undefined));
    service.markAsRead(7).subscribe(() => {
      expect(mockHttp.put).toHaveBeenCalled();
      done();
    });
  });
});
