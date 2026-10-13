import {initializeUserInfo} from './db/ModelSceham/userSchema'
import {userEmergencyContacts, userReferrenceEmployees} from './db/ModelSceham/user/2_emergencyContact'
import {userBankInfo} from './db/ModelSceham/user/3_bankinfo'
import {userSoftwareMasterInfo} from './db/ModelSceham/user/4_softwareskills'
import {userDocumentMasterInfo} from './db/ModelSceham/user/5_documentUpload'
import {userEducatioMasterInfo} from './db/ModelSceham/user/6_education'
import {userExperienceMasterInfo} from './db/ModelSceham/user/7_experience'
import {userLanguageMasterInfo} from './db/ModelSceham/user/8_languages'
import {userSalaryMasterInfo} from './db/ModelSceham/user/9_salary'
import {userIncentiveMasterInfo} from './db/ModelSceham/user/10_incentive'
import {userPromotionMasterInfo} from './db/ModelSceham/user/11_promotion'
import {userSalarySlipMasterInfo} from './db/ModelSceham/user/12_salaryslip'
import {userAttendanceMasterInfo} from './db/ModelSceham/user/13_attendance'
import {userAttendanceLogMasterInfo} from './db/ModelSceham/user/14_attedance_log'
import {userLeaveRequestMasterInfo} from './db/ModelSceham/user/15_leaverequest'
import {userLeaveBalanceMasterInfo} from './db/ModelSceham/user/16_leavebalance'
import {userResignMasterInfo} from './db/ModelSceham/user/17_resignation'
import {userActivityLoginMasterInfo} from './db/ModelSceham/user/18_loginEntry'
import {teamsInfo} from './db/ModelSceham/teams/team'
import {membersInfo} from './db/ModelSceham/teams/teammembers'

import {campaginInfo} from './db/ModelSceham/project/campagin'
import {leadsInfo} from './db/ModelSceham/project/campagin'
import {leadsFollowupInfo} from './db/ModelSceham/project/campagin'
import {clientInfo} from './db/ModelSceham/project/client';
import {projectInfo} from './db/ModelSceham/project/client';
import {projectMilestoneInfo} from './db/ModelSceham/project/client';
import {projectMilesTaskInfo} from './db/ModelSceham/project/client';
import {projectMeetingInfo} from './db/ModelSceham/project/client';
import {projectPaymentsInfo} from './db/ModelSceham/project/client';
import {notificationInfo} from './db/ModelSceham/Notification/notification';
import {userYearlyPerformanceMasterInfo} from './db/ModelSceham/user/9_salary'





export const InitializeAllUserTables = async () => {
    const tableInitializers = [
        { name: "User Info", fn: initializeUserInfo },
        { name: "Emergency Contacts", fn: userEmergencyContacts },
        { name: "Referrence Employees", fn: userReferrenceEmployees },
        { name: "Bank Info", fn: userBankInfo },
        { name: "Software Master Info", fn: userSoftwareMasterInfo },
        { name: "Document Master Info", fn: userDocumentMasterInfo },
        { name: "Education Master Info", fn: userEducatioMasterInfo },
        { name: "Experience Master Info", fn: userExperienceMasterInfo },
        { name: "Language Master Info", fn: userLanguageMasterInfo },
        { name: "Salary Master Info", fn: userSalaryMasterInfo },
        { name: "Incentive Master Info", fn: userIncentiveMasterInfo },
        { name: "Promotion Master Info", fn: userPromotionMasterInfo },
        { name: "Salary Slip Master Info", fn: userSalarySlipMasterInfo },
        { name: "Attendance Master Info", fn: userAttendanceMasterInfo },
        { name: "Attendance Log Master Info", fn: userAttendanceLogMasterInfo },
        { name: "Leave Request Master Info", fn: userLeaveRequestMasterInfo },
        { name: "Leave Balance Master Info", fn: userLeaveBalanceMasterInfo },
        { name: "Login Entry Master Info", fn: userActivityLoginMasterInfo },
        { name: "Resign Master Info", fn: userResignMasterInfo },
        { name: "Team Master Info", fn: teamsInfo },
        { name: "Member Master Info", fn: membersInfo }
    ];

    const failedTables = [];
    const successfulTables: string[] = [];
    for (const { name, fn } of tableInitializers) {
        try {
            await fn();
            successfulTables.push(name);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Error initializing ${name}: ${errorMsg}`);
            failedTables.push({ table: name, error: errorMsg });
        }
    }

    if (failedTables.length > 0) {
        return {
            status: false,
            message: "Some tables failed to initialize.",
            failedTables
        };
    } else {
        return {
            status: true,
            message: `All user tables initialized successfully: ${successfulTables.join(", ")}`
        };
    }
};


export const InitializeAllProjectTables = async () => {
    const tableInitializers = [
        { name: "Campaign Info", fn: campaginInfo },
        { name: "Camp Leads Info", fn: leadsInfo },
        { name: "Camp followup Info", fn: leadsFollowupInfo },
        { name: "Client Info", fn: clientInfo },
        { name: "Project Info", fn: projectInfo },
        { name: "Project Milestone Info", fn: projectMilestoneInfo },
        { name: "Project Milestone Task Info", fn: projectMilesTaskInfo },
        { name: "Project Meeting/Doc Info", fn: projectMeetingInfo },
        { name: "Project Request/Pay Info", fn: projectPaymentsInfo },
        { name: "Notification Info", fn: notificationInfo },
        { name: "Yearly Performance Info", fn: userYearlyPerformanceMasterInfo },
    ];

    const failedTables = [];
    const successfulTables: string[] = [];
    for (const { name, fn } of tableInitializers) {
        try {
            await fn();
            successfulTables.push(name);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Error initializing ${name}: ${errorMsg}`);
            failedTables.push({ table: name, error: errorMsg });
        }
    }

    if (failedTables.length > 0) {
        return {
            status: false,
            message: "Some tables failed to initialize.",
            failedTables
        };
    } else {
        return {
            status: true,
            message: `All user tables initialized successfully: ${successfulTables.join(", ")}`
        };
    }
};