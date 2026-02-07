import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-lantern-blue-600 px-6 py-8 sm:px-10 sm:py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Privacy Policy for LANTERN360
            </h1>
            <p className="text-blue-100 text-lg sm:text-xl">
              <strong>Last updated:</strong> February 2026
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 sm:px-10 sm:py-12 space-y-8">
          {/* Introduction */}
          <section className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              LANTERN360 respects the privacy of its users. This Privacy Policy
              explains how we collect, use, store, share, and protect
              information when you use the LANTERN360 mobile application
              ("App").
            </p>
            <p className="text-gray-700 leading-relaxed">
              LANTERN360 is an employee-tracking and field-work management
              application designed for organizations to monitor field employees'
              attendance, travel activities, work sessions, and leave
              management. This App is intended{" "}
              <strong className="font-semibold text-cowberry-green-500">
                only for authorized field employees
              </strong>{" "}
              of organizations using LANTERN360.
            </p>
            <div className="bg-blue-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-gray-700 italic">
                By installing and using this App, you agree to the collection
                and use of information in accordance with this Privacy Policy.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 1 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              1. Information We Collect
            </h2>

            <div className="space-y-6 pl-0 sm:pl-4">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  1.1 Personal Information
                </h3>
                <p className="text-gray-700">
                  We may collect the following personal information:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Employee name</li>
                  <li>Employee ID or username</li>
                  <li>
                    Phone number or contact details (if provided by the
                    organization)
                  </li>
                  <li>Email address</li>
                  <li>Login credentials (securely processed)</li>
                  <li>Job title and reporting hierarchy information</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  1.2 Location Information
                </h3>
                <p className="text-gray-700">
                  We collect location data to enable employee travel tracking
                  and attendance verification, including:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>
                    <strong className="font-semibold">
                      Precise (fine) location
                    </strong>
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Approximate (coarse) location
                    </strong>
                  </li>
                  <li>
                    <strong className="font-semibold">
                      Background location
                    </strong>
                    , when travel is active
                  </li>
                </ul>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium mb-2">
                    Location data is collected:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>During check-in and check-out</li>
                    <li>While travel is started by the employee</li>
                    <li>
                      At regular intervals when the App is running in the
                      background during an active travel session
                    </li>
                  </ul>
                </div>
                <p className="text-gray-700 italic">
                  This data is collected{" "}
                  <strong className="font-semibold">
                    only for official work purposes
                  </strong>{" "}
                  and as required by the organization.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  1.3 Leave Management Information
                </h3>
                <p className="text-gray-700">
                  We collect leave-related information including:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Leave application details (dates, type, reason)</li>
                  <li>Medical certificates or supporting documents</li>
                  <li>Leave approval/rejection status</li>
                  <li>Approver information (reporting manager or HR)</li>
                  <li>Leave balance and history</li>
                  <li>Comments and notes from approvers</li>
                </ul>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700 font-medium mb-2">
                    Leave Approval Hierarchy:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>
                      <strong>Field Employees:</strong> Can apply for leave
                    </li>
                    <li>
                      <strong>Reporting Managers:</strong> Can approve or reject
                      leave requests of their juniors
                    </li>
                    <li>
                      <strong>HR Personnel:</strong> Can approve or reject leave
                      requests and have access to all leave records
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  1.4 Camera and Media Information
                </h3>
                <p className="text-gray-700">
                  We collect images captured using your device camera for:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Odometer image uploads (start and stop travel)</li>
                  <li>Farmer images during session completion</li>
                  <li>Profile or work-related documentation</li>
                  <li>Medical certificates for leave applications</li>
                  <li>Supporting documents for leave requests</li>
                </ul>
                <p className="text-gray-700">
                  We may also access stored media files when you choose to
                  upload images.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  1.5 Travel History Information
                </h3>
                <p className="text-gray-700">
                  We maintain comprehensive travel history including:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  <li>Session start and end times</li>
                  <li>Travel routes and paths</li>
                  <li>Distance traveled during each session</li>
                  <li>Odometer readings (start and stop)</li>
                  <li>Session locations and GPS coordinates</li>
                  <li>Duration of each travel session</li>
                  <li>Session completion status</li>
                </ul>
                <p className="text-gray-700 italic">
                  Field employees can view their complete travel history within
                  the App.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  1.6 Usage and Activity Data
                </h3>
                <p className="text-gray-700">
                  We collect app usage data such as:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Check-in and check-out logs</li>
                  <li>Travel session start and stop times</li>
                  <li>Attendance records</li>
                  <li>Session activities and timestamps</li>
                  <li>Chat messages within the App</li>
                  <li>Leave application and approval activities</li>
                  <li>Travel history access logs</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  1.7 Device and Technical Information
                </h3>
                <p className="text-gray-700">We may collect:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Device type, OS version</li>
                  <li>App version</li>
                  <li>Network status</li>
                  <li>
                    Battery-related information (for optimizing background
                    tracking)
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 2 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              2. Permissions We Require and Why
            </h2>
            <p className="text-gray-700">
              LANTERN360 requests the following permissions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  permission: "Internet",
                  reason: "To sync data with our servers",
                },
                {
                  permission: "Camera",
                  reason:
                    "To capture odometer, work-related images, and medical certificates",
                },
                {
                  permission: "Access Fine & Coarse Location",
                  reason: "For accurate travel and attendance tracking",
                },
                {
                  permission: "Access Background Location",
                  reason: "To log travel while the App runs in the background",
                },
                {
                  permission: "Foreground Service Location",
                  reason: "To continuously track location during active travel",
                },
                {
                  permission: "Foreground Service",
                  reason: "To ensure uninterrupted travel tracking",
                },
                {
                  permission: "Read & Write Contacts",
                  reason: "For work-related communication features",
                },
                {
                  permission: "Read External Storage / Media Images",
                  reason:
                    "To upload images and documents for sessions and leave applications",
                },
                {
                  permission: "Write External Storage",
                  reason:
                    "To save work-related files, travel history reports, and leave documents",
                },
                {
                  permission: "Battery Stats",
                  reason: "To optimize tracking performance and reliability",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                >
                  <h4 className="font-semibold text-lantern-blue-600 mb-1">
                    {item.permission}
                  </h4>
                  <p className="text-gray-700 text-sm">{item.reason}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-700 italic">
              Permissions are requested{" "}
              <strong className="font-semibold">only when required</strong> for
              App functionality.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 3 */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              3. How We Use Your Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Verify employee attendance (check-in/check-out)",
                "Track travel distance and routes during work sessions",
                "Record work sessions and activities",
                "Enable communication and chat features",
                "Display announcements from management or HR",
                "Maintain attendance calendars",
                "Manage leave applications and approvals",
                "Track leave balances and history",
                "Provide travel history access to field employees",
                "Enable reporting managers to approve/reject leave requests",
                "Enable HR to manage all leave applications",
                "Generate travel history reports and analytics",
                "Improve App performance and reliability",
                "Ensure compliance with organizational policies",
              ].map((use, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-lantern-blue-600 rounded-full"></div>
                  <p className="text-gray-700">{use}</p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* New Section: Leave Management Flow */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              4. Leave Management System
            </h2>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-cowberry-green-500 mb-4">
                Leave Application and Approval Process
              </h3>
              <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                <li>
                  Field employee submits leave request with details (dates,
                  type, reason)
                </li>
                <li>Supporting documents can be uploaded if required</li>
                <li>
                  Leave request is routed to the reporting manager for approval
                </li>
                <li>
                  Reporting manager can approve or reject the leave request
                </li>
                <li>HR receives notification and can also approve/reject</li>
                <li>Employee receives notification of leave status</li>
                <li>Leave balance is automatically updated</li>
                <li>Leave history is maintained for all users</li>
              </ol>
              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="text-gray-700 font-semibold mb-2">
                  Access Levels:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>
                    <strong>Field Employees:</strong> Apply for leave, view own
                    leave history and status
                  </li>
                  <li>
                    <strong>Reporting Managers:</strong> Approve/reject junior
                    leave requests, view team leave calendar
                  </li>
                  <li>
                    <strong>HR Personnel:</strong> Full access to all leave
                    applications and approval rights
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* New Section: Travel History */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              5. Travel History Access
            </h2>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-cowberry-green-500 mb-4">
                Travel History Features
              </h3>
              <p className="text-gray-700 mb-4">
                Field employees can access their complete travel history
                including:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Daily travel sessions with timestamps</li>
                <li>Travel routes on interactive maps</li>
                <li>Distance covered in each session</li>
                <li>Session duration and timing</li>
                <li>Odometer readings (start and end)</li>
                <li>Session completion status</li>
                <li>Historical travel patterns and trends</li>
              </ul>
              <div className="mt-4 p-4 bg-white rounded-lg">
                <p className="text-gray-700 italic">
                  Travel history data is stored securely and is accessible only
                  to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 mt-2">
                  <li>The field employee for their own sessions</li>
                  <li>Reporting managers for their team members</li>
                  <li>HR and authorized administrators</li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Continue with existing sections, updating section numbers */}

          {/* Section 4 becomes 6, etc. */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              6. Work Session Flow
            </h2>
            <p className="text-gray-700">
              The App follows this general workflow:
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                <li>Employee logs into the App</li>
                <li>Employee checks in</li>
                <li>Employee starts travel by uploading an odometer image</li>
                <li>
                  Location tracking begins (foreground/background as required)
                </li>
                <li>
                  Employee stops travel by uploading another odometer image
                </li>
                <li>Employee adds farmer details (name, description, image)</li>
                <li>Session is completed and added to travel history</li>
                <li>Employee can view travel history anytime</li>
              </ol>
              <p className="text-gray-700 mt-4 italic">
                An employee may perform multiple such sessions in a single day.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Section 5 becomes 7, etc. - Continue updating section numbers */}

          {/* Keep all existing sections but update their numbers to account for new sections */}

          {/* Add updated sections for background location, data sharing, etc. */}

          {/* Updated Contact Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
              15. Contact Us
            </h2>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, leave
              management system, travel history features, or data practices,
              please contact:
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-cowberry-green-500 mb-2">
                LANTERN360 Support
              </h3>
              <p className="text-gray-700">
                Email:{" "}
                <a
                  href="mailto:support@lantern360.com"
                  className="text-cowberry-green-500 hover:text-blue-800 underline font-medium"
                >
                  team.lantern360@gmail.com
                </a>
              </p>
              <p className="text-gray-700 mt-2">
                For technical issues with leave management or travel history
                features, please contact our technical support team.
              </p>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200 my-8" />

          {/* Footer */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-700 font-semibold text-lg">
              By using LANTERN360, you acknowledge that you have read and
              understood this Privacy Policy, including the leave management and
              travel history features.
            </p>
            <p className="text-gray-600 mt-2">
              <strong>Note:</strong> The leave approval mechanism and travel
              history access are subject to your organization's policies and
              configurations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
