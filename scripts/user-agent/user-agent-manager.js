class UserAgentManager {
    static apply(settings) {
        if (settings && settings.enabled && settings.ua) {
            let secChUa, secChUaMobile, secChUaPlatform;
            const ua = settings.ua;

            if (/Windows/i.test(ua)) secChUaPlatform = '"Windows"';
            else if (/Macintosh|Mac OS X/i.test(ua)) secChUaPlatform = '"macOS"';
            else if (/Linux/i.test(ua)) secChUaPlatform = '"Linux"';
            else if (/Android/i.test(ua)) secChUaPlatform = '"Android"';
            else if (/iPhone|iPad|iPod/i.test(ua)) secChUaPlatform = '"iOS"';
            else secChUaPlatform = '"Unknown"';

            secChUaMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? '?1' : '?0';
            secChUa = '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"';

            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [1001],
                addRules: [{
                    id: 1001,
                    priority: 1,
                    action: {
                        type: "modifyHeaders",
                        requestHeaders: [
                            { header: "User-Agent", operation: "set", value: settings.ua },
                            { header: "Sec-Ch-Ua", operation: "set", value: secChUa },
                            { header: "Sec-Ch-Ua-Mobile", operation: "set", value: secChUaMobile },
                            { header: "Sec-Ch-Ua-Platform", operation: "set", value: secChUaPlatform }
                        ]
                    },
                    condition: {
                        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest"],
                        urlFilter: "|"
                    }
                }]
            });
        } else {
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [1001],
                addRules: []
            });
        }
    }
}