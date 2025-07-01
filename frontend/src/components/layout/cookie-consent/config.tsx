import {show, type CookieConsentConfig} from 'vanilla-cookieconsent';

export const config: CookieConsentConfig = {
  guiOptions: {
    consentModal: {
      layout: 'box',
      position: 'bottom right',
      equalWeightButtons: true,
      flipButtons: false
    },
    preferencesModal: {
      layout: 'box',
      position: 'left',
      equalWeightButtons: true,
      flipButtons: false
    }
  },
  onFirstConsent: function () {
    show();
  },
  categories: {
    necessary: {
      readOnly: true,
      enabled: true
    },
    analytics: {
      autoClear: {
        cookies: [
          {
            name: /^(_ga|_gid)/
          }
        ]
      }
    }
  },
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'Cookie Consent',
          description: 'By continuing to use our website, you acknowledge the use of cookies.',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          showPreferencesBtn: 'Manage preferences',
          footer: `
            <a href="https://www.cisco.com/c/en/us/about/legal/privacy-full.html" target="_blank">Privacy Policy</a>
          `
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          savePreferencesBtn: 'Save preferences',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Cookie Usage',
              description:
                'I use cookies to ensure the basic functionalities of the website and to enhance your online experience. You can choose for each category to opt-in/out whenever you want. For more details relative to cookies and other sensitive data, please read the full <a href="https://www.cisco.com/c/en/us/about/legal/privacy-full.html" class="cc__link" target="_blank">privacy policy</a>.'
            },
            {
              title: 'Strictly necessary cookies',
              description:
                'These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.    You can set your browser to block or alert you about these cookies, but some parts of the site will not then work. These cookies do not store any personally identifiable information.',
              linkedCategory: 'necessary',
              cookieTable: {
                headers: {
                  name: 'Name',
                  description: 'Description'
                },
                body: [
                  {
                    name: 'OneTrust',
                    description:
                      "OneTrust LLC (OneTrust) is a provider of privacy management software platform. The company's platform supports organizations to adhere compliance with the data privacy, governance and security regulations across sectors and jurisdictions."
                  }
                ]
              }
            },
            {
              title: 'Performance and Analytics cookies',
              linkedCategory: 'analytics',
              cookieTable: {
                headers: {
                  name: 'Name',
                  domain: 'Company',
                  description: 'Description'
                },
                body: [
                  {
                    name: 'Segment',
                    domain: 'segment.com',
                    description: 'Segment.io is an analytics service for web applications.'
                  }
                ]
              }
            }
          ]
        }
      }
    }
  }
};
