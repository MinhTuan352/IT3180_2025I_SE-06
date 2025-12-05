// src/routes/index.tsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoutes from './ProtectedRoutes'; // Import

// Import các trang BOD
import SignIn from '../pages/Auth/SignIn';
import AdminList from '../pages/BOD/AdminManagement/AdminList';
import NotFound from '../pages/errors/NotFound';
import AdminCreate from '../pages/BOD/AdminManagement/AdminCreate.tsx';
import AdminProfile from '../pages/BOD/AdminManagement/AdminProfile';
import ResidentList from '../pages/BOD/ResidentManagement/ResidentList';
import ResidentCreate from '../pages/BOD/ResidentManagement/ResidentCreate';
import ResidentProfile from '../pages/BOD/ResidentManagement/ResidentProfile';
import FeeList from '../pages/BOD/FeeManagement/FeeList';
import NotificationList from '../pages/BOD/NotificationManagement/NotificationList';
import NotificationCreate from '../pages/BOD/NotificationManagement/NotificationCreate';
import NotificationDetail from '../pages/BOD/NotificationManagement/NotificationDetail';
import ReportList from '../pages/BOD/ReportManagement/ReportList';
import ReportDetail from '../pages/BOD/ReportManagement/ReportDetail';
import LoginManagement from '../pages/BOD/LoginManagement/LoginManagement.tsx';
import AssetList from '../pages/BOD/AssetManagement/AssetList';
import AssetDetail from '../pages/BOD/AssetManagement/AssetDetail';
import ServiceList from '../pages/BOD/ServiceManagement/ServiceList';

// --- Import các trang Kế toán ---
import AccountantFeeList from '../pages/Accountant/FeeManagement/AccountantFeeList.tsx';
import AccountantFeeInvoice from '../pages/Accountant/FeeManagement/AccountantFeeInvoice.tsx';
import AccountantFeeInvoiceCreate from '../pages/Accountant/FeeManagement/AccountantFeeInvoiceCreate.tsx';
import AccountantFeeInvoiceEdit from '../pages/Accountant/FeeManagement/AccountantFeeInvoiceEdit.tsx';
import AccountantSetup from '../pages/Accountant/Setup/AccountantSetup.tsx';
import AccountantFeeSetupList from '../pages/Accountant/Setup/FeeSetupList.tsx';
import AccountantFeeSetupCreate from '../pages/Accountant/Setup/FeeSetupCreate.tsx';
import AccountantFeeSetupEdit from '../pages/Accountant/Setup/FeeSetupEdit.tsx';
import AccountantPaymentSetupList from '../pages/Accountant/Setup/PaymentSetupList.tsx';
import AccountantPaymentSetupCreate from '../pages/Accountant/Setup/PaymentSetupCreate.tsx';
import AccountantPaymentSetupEdit from '../pages/Accountant/Setup/PaymentSetupEdit.tsx';
import AccountantFeeBatchCreate from '../pages/Accountant/FeeManagement/AccountantFeeBatchCreate.tsx';
import AccountantMeasureImport from '../pages/Accountant/Setup/AccountantMeasureImport.tsx'; // Import từ folder Setup

import ResidentAccountInfo from '../pages/Resident/Account/ResidentAccountInfo.tsx';
import ResidentProfileEdit from '../pages/Resident/Profile/ResidentProfileEdit.tsx';
import ResidentFeeList from '../pages/Resident/Fee/ResidentFeeList.tsx';
import ResidentFeeInvoiceInfo from '../pages/Resident/Fee/ResidentFeeInvoiceInfo.tsx';
import ResidentFeePayment from '../pages/Resident/Fee/ResidentFeePayment.tsx';
import ResidentNotificationList from '../pages/Resident/Notification/ResidentNotificationList.tsx';
import ResidentReportSend from '../pages/Resident/Report/ResidentReportSend.tsx';
import ResidentReportList from '../pages/Resident/Report/ResidentReportList.tsx';
import ResidentAssetList from '../pages/Resident/Asset/ResidentAssetList';
import ResidentServiceList from '../pages/Resident/Service/ResidentServiceList';
import ResidentServiceDetail from '../pages/Resident/Service/ResidentServiceDetail';

// --- Import trang Account Chung (Mới) ---
import AccountInfo from '../pages/Account/AccountInfo.tsx';
import LoginHistory from '../pages/Account/LoginHistory.tsx';

import BuildingInfo from '../pages/Common/BuildingInfo.tsx';
import AccessControl from '../pages/BOD/AccessControl/AccessControl';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Route công khai */}
      <Route path="/signin" element={<SignIn />} />

      {/* Bọc các route cần bảo vệ bằng ProtectedRoutes */}
      <Route element={<ProtectedRoutes />}>
        {/* Tất cả các route bên trong này đều phải đăng nhập mới vào được */}
        <Route path="/" element={<MainLayout />}>

          {/* --- ROUTES CHUNG CHO CÁC TÀI KHOẢN (Logged in) --- */}
          <Route path="account/info" element={<AccountInfo />} />
          <Route path="account/history" element={<LoginHistory />} />
          <Route path="building-info" element={<BuildingInfo />} />

          {/* BOD Routes (Ví dụ: chỉ cho phép 'bod') */}
          <Route 
            element={
              <ProtectedRoutes allowedRoles={['bod']} />
            }
          >
            <Route path="bod/admin/list" element={<AdminList />} />
            <Route path="bod/admin/profile/create" element={<AdminCreate />} />
            <Route path="bod/admin/profile/:id" element={<AdminProfile />} />

            <Route path="bod/resident/list" element={<ResidentList />} />
            <Route path="bod/resident/profile/create" element={<ResidentCreate />} />
            <Route path="bod/resident/profile/:id" element={<ResidentProfile />} />

            <Route path="bod/login-management" element={<LoginManagement />} />
            <Route path="bod/access-control" element={<AccessControl />} />

            <Route path="bod/fee/list" element={<FeeList />} />

            <Route path="bod/asset/list" element={<AssetList />} />
            <Route path="bod/asset/detail/:id" element={<AssetDetail />} />

            <Route path="bod/service/list" element={<ServiceList />} />

            <Route path="bod/notification/list" element={<NotificationList />} />
            <Route path="bod/notification/create" element={<NotificationCreate />} />
            <Route path="bod/notification/detail/:id" element={<NotificationDetail />} />

            <Route path="bod/report/list" element={<ReportList />} />
            <Route path="bod/report/list/detail/:id" element={<ReportDetail />} />
            
            {/* ... các route bod khác ... */}
          </Route>

          {/* === ACCOUNTANT Routes (THÊM MỚI) === */}
          <Route 
            element={
              <ProtectedRoutes allowedRoles={['accountance']} />
            }
          >
            {/* Công nợ */}
            <Route path="accountance/fee/list" element={<AccountantFeeList />} />
            <Route path="accountance/fee/list/invoice/:id" element={<AccountantFeeInvoice />} />
            <Route path="accountance/fee/list/invoice/create" element={<AccountantFeeInvoiceCreate />} />
            <Route path="accountance/fee/list/invoice/edit/:id" element={<AccountantFeeInvoiceEdit />} />
            <Route path="accountance/fee/batch-create" element={<AccountantFeeBatchCreate />} />
            
            {/* Thiết lập */}
            <Route path="accountance/fee/setup" element={<AccountantSetup />} />
            <Route path="accountance/fee/setup/feeSetup" element={<AccountantFeeSetupList />} />
            <Route path="accountance/fee/setup/feeSetup/create" element={<AccountantFeeSetupCreate />} />
            <Route path="accountance/fee/setup/feeSetup/edit/:id" element={<AccountantFeeSetupEdit />} />
            <Route path="accountance/fee/setup/paymentSetup" element={<AccountantPaymentSetupList />} />
            <Route path="accountance/fee/setup/paymentSetup/create" element={<AccountantPaymentSetupCreate />} />
            <Route path="accountance/fee/setup/paymentSetup/edit/:id" element={<AccountantPaymentSetupEdit />} />
            <Route path="accountance/fee/setup/import-measure" element={<AccountantMeasureImport />} />
          </Route>

          {/* === RESIDENT Routes (THÊM MỚI) === */}
          <Route element={ <ProtectedRoutes allowedRoles={['resident']} /> }>
             {/* Account */}
             <Route path="resident/account_info" element={<ResidentAccountInfo />} />
             {/* Profile (Redirect handled by menu, directly use edit) */}
             <Route path="resident/profile/edit" element={<ResidentProfileEdit />} />
             {/* Fee */}
             <Route path="resident/fee/list" element={<ResidentFeeList />} />
             <Route path="resident/fee/invoice_info/:id" element={<ResidentFeeInvoiceInfo />} />
             <Route path="resident/fee/payment/:id" element={<ResidentFeePayment />} /> {/* Assuming payment is for a specific invoice */}
             
             <Route path="resident/asset/list" element={<ResidentAssetList />} />

             <Route path="resident/service/list" element={<ResidentServiceList />} />
             <Route path="resident/service/detail/:id" element={<ResidentServiceDetail />} />
             
             {/* Notification */}
             <Route path="resident/notification/list" element={<ResidentNotificationList />} />
             {/* Report */}
             <Route path="resident/report/send" element={<ResidentReportSend />} />
             <Route path="resident/report/list" element={<ResidentReportList />} />

             {/* Auto-redirect for /resident/profile */}
             <Route path="resident/profile" element={<ResidentProfileEdit />} />

          </Route>

          {/* ... các route cho Kế toán và Cư dân ... */}

          <Route index element={<BuildingInfo />} />
        </Route>
      </Route>

      {/* Route 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}