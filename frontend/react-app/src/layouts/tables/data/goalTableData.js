/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import HomeIcon from "@mui/icons-material/Home";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
export default function data() {
  const Goal = ({ icon: IconComponent, name, description }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <IconComponent fontSize="small" />
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {name}
        </MDTypography>
        <MDTypography variant="caption">{description}</MDTypography>
      </MDBox>
    </MDBox>
  );
  return {
    columns: [
      { Header: "Goal", accessor: "Goal", width: "45%", align: "left" },
      { Header: "Target", accessor: "Target", align: "left" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "Date", accessor: "Date", align: "center" },
      { Header: "action", accessor: "action", align: "center" },
    ],

    rows: [
      {
        Goal: (
          <Goal
            icon={HomeIcon}
            name="House Fund"
            description="To build a vacation house in Spain"
          />
        ),
        Target: (
          <MDBox ml={-1}>
            <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
              €30000
            </MDTypography>
          </MDBox>
        ),
        status: (
          <MDBox ml={-1}>
            <MDBadge badgeContent="In Progress" color="success" variant="gradient" size="sm" />
          </MDBox>
        ),
        Date: (
          <MDBox ml={-1}>
            <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
              23/04/28
            </MDTypography>
          </MDBox>
        ),
        action: (
          <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
            Edit
          </MDTypography>
        ),
      },
      {
        Goal: <Goal icon={SportsEsportsIcon} name="House Fund" description="Buy new switch" />,
        Target: (
          <MDBox ml={-1}>
            <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
              €2000
            </MDTypography>
          </MDBox>
        ),
        status: (
          <MDBox ml={-1}>
            <MDBadge badgeContent="Paused" color="failed" variant="gradient" size="sm" />
          </MDBox>
        ),
        Date: (
          <MDBox ml={-1}>
            <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
              01/08/25
            </MDTypography>
          </MDBox>
        ),
        action: (
          <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
            Edit
          </MDTypography>
        ),
      },
    ],
  };
}
