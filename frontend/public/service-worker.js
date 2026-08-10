self.addEventListener('push', function (event) {
    let data = { title: 'تحديث جديد', body: 'يوجد تحديث بخصوص طلبك', url: '/' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        tag: 'order-status-' + (data.url ? data.url.split('/').pop() : 'update'),
        renotify: true,
        data: {
            url: data.url
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data.url;

    // This looks to see if the current is already open and
    // focuses if it is
    event.waitUntil(
        clients.matchAll({
            type: "window"
        }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client)
                    return client.focus();
            }
            if (clients.openWindow)
                return clients.openWindow(urlToOpen);
        })
    );
});
