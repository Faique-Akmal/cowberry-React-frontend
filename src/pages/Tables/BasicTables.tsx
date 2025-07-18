import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
// import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
import UserPagination from "../Employee/UserPagination";

export default function BasicTables() {
  return (
    <>
      <PageMeta title="userPagination Dashboard"/>
    
      <div >
        <PageBreadcrumb title="User Pagination"/>
         
         <UserPagination/>

        {/* <ComponentCard title="Basic Table 1">
          {/* <BasicTableOne /> */}
          {/* <UserPagination/>
       
        </ComponentCard> */} 

      </div>
    </>
  );
}
