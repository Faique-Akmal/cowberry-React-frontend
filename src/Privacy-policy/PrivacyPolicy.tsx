import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cowberry-green-500 to-cowberry-green-600 px-6 py-8 sm:px-10 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Privacy Policy for LANTERN360
            </h1>
            <p className="text-blue-100 text-lg sm:text-xl">
              <strong>Last updated:</strong> January 2026
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-8">
          {/* Introduction */}
          <section className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              LANTERN360 ,we respects the privacy of its users. This Privacy Policy explains how we collect, use, store, share, and protect information when you use the LANTERN360 mobile application ("App").
            </p>
            <p className="text-gray-700 leading-relaxed">
              LANTERN360 is an employee-tracking and field-work management application designed for organizations to monitor field employees' attendance, travel activities, and work sessions. This App is intended <strong className="font-semibold text-cowberry-green-500">only for authorized field employees</strong> of organizations using LANTERN360.
            </p>
            <div className="bg-blue-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-gray-700 italic">
                By installing and using this App, you agree to the collection and use of information in accordance with this Privacy Policy.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 1 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">1. Information We Collect</h2>
            
            <div className="space-y-6 pl-0 sm:pl-4">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">1.1 Personal Information</h3>
                <p className="text-gray-700">We may collect the following personal information:</p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Employee name</li>
                  <li>Employee ID or username</li>
                  <li>Phone number or contact details (if provided by the organization)</li>
                  <li>Login credentials (securely processed)</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">1.2 Location Information</h3>
                <p className="text-gray-700">
                  We collect location data to enable employee travel tracking and attendance verification, including:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li><strong className="font-semibold">Precise (fine) location</strong></li>
                  <li><strong className="font-semibold">Approximate (coarse) location</strong></li>
                  <li><strong className="font-semibold">Background location</strong>, when travel is active</li>
                </ul>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium mb-2">Location data is collected:</p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>During check-in and check-out</li>
                    <li>While travel is started by the employee</li>
                    <li>At regular intervals when the App is running in the background during an active travel session</li>
                  </ul>
                </div>
                <p className="text-gray-700 italic">
                  This data is collected <strong className="font-semibold">only for official work purposes</strong> and as required by the organization.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">1.3 Camera and Media Information</h3>
                <p className="text-gray-700">We collect images captured using your device camera for:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Odometer image uploads (start and stop travel)</li>
                  <li>Farmer images during session completion</li>
                  <li>Profile or work-related documentation</li>
                </ul>
                <p className="text-gray-700">We may also access stored media files when you choose to upload images.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">1.4 Contacts Information</h3>
                <p className="text-gray-700">If permitted, we may access contacts to:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Read or save work-related contacts</li>
                  <li>Enable communication features within the App</li>
                </ul>
                <p className="text-gray-700 italic">
                  Contacts are <strong className="font-semibold">not shared or used for marketing purposes</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">1.5 Usage and Activity Data</h3>
                <p className="text-gray-700">We collect app usage data such as:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Check-in and check-out logs</li>
                  <li>Travel session start and stop times</li>
                  <li>Attendance records</li>
                  <li>Session activities and timestamps</li>
                  <li>Chat messages within the App</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">1.6 Device and Technical Information</h3>
                <p className="text-gray-700">We may collect:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Device type, OS version</li>
                  <li>App version</li>
                  <li>Network status</li>
                  <li>Battery-related information (for optimizing background tracking)</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 2 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">2. Permissions We Require and Why</h2>
            <p className="text-gray-700">LANTERN360 requests the following permissions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { permission: "Internet", reason: "To sync data with our servers" },
                { permission: "Camera", reason: "To capture odometer and work-related images" },
                { permission: "Access Fine & Coarse Location", reason: "For accurate travel and attendance tracking" },
                { permission: "Access Background Location", reason: "To log travel while the App runs in the background" },
                { permission: "Foreground Service Location", reason: "To continuously track location during active travel" },
                { permission: "Foreground Service", reason: "To ensure uninterrupted travel tracking" },
                { permission: "Read & Write Contacts", reason: "For work-related communication features" },
                { permission: "Read External Storage / Media Images", reason: "To upload images" },
                { permission: "Write External Storage", reason: "To save work-related files" },
                { permission: "Battery Stats", reason: "To optimize tracking performance and reliability" }
              ].map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-cowberry-green-500 mb-1">{item.permission}</h4>
                  <p className="text-gray-700 text-sm">{item.reason}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-700 italic">
              Permissions are requested <strong className="font-semibold">only when required</strong> for App functionality.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 3 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">3. How We Use Your Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Verify employee attendance (check-in/check-out)",
                "Track travel distance and routes during work sessions",
                "Record work sessions and activities",
                "Enable communication and chat features",
                "Display announcements from management or HR",
                "Maintain attendance calendars",
                "Improve App performance and reliability",
                "Ensure compliance with organizational policies"
              ].map((use, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-600 rounded-full"></div>
                  <p className="text-gray-700">{use}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 4 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">4. Work Session Flow</h2>
            <p className="text-gray-700">The App follows this general workflow:</p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                <li>Employee logs into the App</li>
                <li>Employee checks in</li>
                <li>Employee starts travel by uploading an odometer image</li>
                <li>Location tracking begins (foreground/background as required)</li>
                <li>Employee stops travel by uploading another odometer image</li>
                <li>Employee adds farmer details (name, description, image)</li>
                <li>Session is completed</li>
              </ol>
              <p className="text-gray-700 mt-4 italic">
                An employee may perform multiple such sessions in a single day.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 5 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">5. Background Location Usage Disclosure</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-gray-700">
                LANTERN360 collects <strong className="font-semibold">background location data</strong> even when the App is closed or not in active use <strong className="font-semibold">only when travel is active</strong>.
              </p>
            </div>
            <p className="text-gray-700">This is required to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Accurately track employee travel routes</li>
              <li>Prevent data loss during background execution</li>
              <li>Ensure reliable session logging</li>
            </ul>
            <p className="text-gray-700 italic">
              Background location tracking <strong className="font-semibold">stops automatically</strong> when travel is stopped by the employee.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 6 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">6. Data Sharing and Disclosure</h2>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-gray-700 font-semibold text-lg">
                We do <strong className="text-green-700">not sell, rent, or trade</strong> personal data.
              </p>
            </div>
            <p className="text-gray-700">Data may be shared only:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>With the employee's organization (employer)</li>
              <li>With authorized managers or HR personnel</li>
              <li>When required by law or legal process</li>
            </ul>
            <p className="text-gray-700 italic">All data sharing is limited to official business use.</p>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 7 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">7. Data Storage and Security</h2>
            <p className="text-gray-700">We take reasonable security measures to protect your data, including:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Secure server storage</li>
              <li>Encrypted network communication</li>
              <li>Restricted access to authorized personnel only</li>
            </ul>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-gray-700 italic">
                However, no method of electronic storage is 100% secure.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 8 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">8. Data Retention</h2>
            <p className="text-gray-700">We retain user data only for as long as:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>Required by the organization</li>
              <li>Necessary to fulfill work, legal, or compliance obligations</li>
            </ul>
            <p className="text-gray-700">Data deletion is handled according to organizational policies.</p>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 9 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">9. User Rights</h2>
            <p className="text-gray-700">Depending on applicable laws, users may have the right to:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Access their data",
                "Request corrections",
                "Request deletion (subject to employer policies)",
                "Withdraw permissions (may limit App functionality)"
              ].map((right, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">{right}</span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 10 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">10. Children's Privacy</h2>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-gray-700 text-lg font-semibold">
                LANTERN360 is <strong className="text-red-700">not intended for children under 18 years of age</strong>. We do not knowingly collect data from minors.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 11 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">11. Third-Party Services</h2>
            <p className="text-gray-700">
              The App may use trusted third-party services (e.g., hosting, analytics) strictly for App functionality. These services are bound by confidentiality obligations.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 12 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. Updates will be posted within the App. Continued use of the App indicates acceptance of the updated policy.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 13 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">13. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy or data practices, please contact:
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-cowberry-green-500 mb-2">LANTERN360 Support</h3>
              <p className="text-gray-700">
                Email:{" "}
                <a 
                  href="mailto:support@lantern360.com" 
                  className="text-cowberry-green-500 hover:text-blue-800 underline font-medium"
                >
                 team.lantern360@gmail.com
                </a>
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Footer */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 font-semibold text-lg">
              By using LANTERN360, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;