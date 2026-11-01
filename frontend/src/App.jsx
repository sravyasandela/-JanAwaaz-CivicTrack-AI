
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Auth from "./components/Auth";

import {
  Menu,
  X,
  Globe,
  ArrowRight,
  ShieldCheck,
  Users,
  Building2,
  MapPin,
  Droplets,
  Trash2,
  Lightbulb,
  Construction,
  Wind,
  AlertCircle,
  FileText,
  Search,
  CheckCircle,
  Eye,
} from "lucide-react";

import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const { i18n } = useTranslation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authData, setAuthData] = useState(null);

  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [pendingCategory, setPendingCategory] = useState(null);

  const [complaints, setComplaints] = useState([]);
  const [adminComplaints, setAdminComplaints] = useState([]);

  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [loadingAdminComplaints, setLoadingAdminComplaints] = useState(false);

  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("all");
  const [adminSearch, setAdminSearch] = useState("");

  const [draftStatuses, setDraftStatuses] = useState({});
  const [updatingComplaintId, setUpdatingComplaintId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Road & Infrastructure");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const changeLanguage = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  // Helper to read API errors.
  const getErrorMessage = (data, fallback) => {
    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (data?.detail) {
      return JSON.stringify(data.detail);
    }

    return fallback;
  };

  // Load citizen complaints.
  useEffect(() => {
    if (!authData?.token || authData.role !== "citizen") {
      setComplaints([]);
      return;
    }

    const fetchComplaints = async () => {
      setLoadingComplaints(true);

      try {
        const response = await fetch(`${API_URL}/my-complaints`, {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Could not load complaints")
          );
        }

        setComplaints(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Complaint loading error:", error);
        setMessage(error.message);
      } finally {
        setLoadingComplaints(false);
      }
    };

    fetchComplaints();
  }, [authData]);

  // Load all complaints for admin.
  useEffect(() => {
    if (!authData?.token || authData.role !== "admin") {
      setAdminComplaints([]);
      return;
    }

    const fetchAdminComplaints = async () => {
      setLoadingAdminComplaints(true);

      try {
        const response = await fetch(`${API_URL}/admin/complaints`, {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Could not load admin complaints")
          );
        }

        setAdminComplaints(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Admin complaint loading error:", error);
        setMessage(error.message);
      } finally {
        setLoadingAdminComplaints(false);
      }
    };

    fetchAdminComplaints();
  }, [authData]);

  // Refresh citizen complaints.
  const refreshComplaints = async () => {
    if (!authData?.token) return;

    setLoadingComplaints(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/my-complaints`, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not refresh complaints")
        );
      }

      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Refresh all admin complaints.
  const refreshAdminComplaints = async () => {
    if (!authData?.token || authData.role !== "admin") return;

    setLoadingAdminComplaints(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/admin/complaints`, {
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not refresh complaints")
        );
      }

      setAdminComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingAdminComplaints(false);
    }
  };

  // Change the selected status in the admin table.
  const handleDraftStatusChange = (complaintId, newStatus) => {
    setDraftStatuses((previous) => ({
      ...previous,
      [complaintId]: newStatus,
    }));
  };

  // Save status to the backend.
  const updateAdminComplaintStatus = async (complaint) => {
    if (!authData?.token) return;

    const newStatus =
      draftStatuses[complaint.id] || complaint.status;

    if (newStatus === complaint.status) {
      setMessage("No status changes to save.");
      return;
    }

    setUpdatingComplaintId(complaint.id);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/admin/complaints/${complaint.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Could not update complaint status")
        );
      }

      setMessage(
        `Complaint #${complaint.id} status updated successfully!`
      );

      setDraftStatuses((previous) => {
        const updated = { ...previous };
        delete updated[complaint.id];
        return updated;
      });

      await refreshAdminComplaints();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUpdatingComplaintId(null);
    }
  };

  // Open complaint form with selected category.
  const openComplaintForm = (selectedCategory) => {
    const selected = selectedCategory || "Road & Infrastructure";

    setCategory(selected);
    setMessage("");

    if (!authData) {
      setPendingCategory(selected);
      setShowAuth(true);
      return;
    }

    if (authData.role !== "citizen") {
      setMessage("Only citizen accounts can submit complaints.");
      return;
    }

    setShowComplaintForm(true);
  };

  // Successful authentication.
  const handleAuthenticated = (data) => {
    setAuthData(data);
    setShowAuth(false);
    setSelectedComplaint(null);

    if (data.role === "citizen" && pendingCategory) {
      setCategory(pendingCategory);
      setShowComplaintForm(true);
    } else {
      setShowComplaintForm(false);

      if (data.role !== "citizen" && pendingCategory) {
        setMessage("Only citizen accounts can submit complaints.");
      }
    }

    setPendingCategory(null);
    setAdminSearch("");
    setAdminStatusFilter("all");
    setAdminCategoryFilter("all");
  };

  // Submit complaint.
  const handleComplaintSubmit = async (event) => {
    event.preventDefault();

    if (!authData?.token) {
      setMessage("Please log in first.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authData.token}`,
        },
        body: JSON.stringify({
          title,
          description,
          location,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Complaint submission failed")
        );
      }

      setMessage("Your complaint was submitted successfully!");

      setTitle("");
      setDescription("");
      setLocation("");

      await refreshComplaints();
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Logout.
  const handleLogout = () => {
    setAuthData(null);
    setComplaints([]);
    setAdminComplaints([]);
    setSelectedComplaint(null);
    setShowComplaintForm(false);
    setShowAuth(false);
    setPendingCategory(null);
    setMessage("");
    setDraftStatuses({});
    setAdminSearch("");
    setAdminStatusFilter("all");
    setAdminCategoryFilter("all");
  };

  const services = [
    {
      icon: <Construction />,
      title: "Road & Infrastructure",
      desc: "Report damaged roads, potholes and public infrastructure.",
    },
    {
      icon: <Droplets />,
      title: "Water Supply",
      desc: "Report water leakage and drinking water problems.",
    },
    {
      icon: <Lightbulb />,
      title: "Electricity",
      desc: "Report streetlight and public electricity issues.",
    },
    {
      icon: <Trash2 />,
      title: "Waste Management",
      desc: "Report garbage collection and sanitation issues.",
    },
    {
      icon: <Wind />,
      title: "Environment",
      desc: "Report pollution and environmental concerns.",
    },
    {
      icon: <AlertCircle />,
      title: "Other Issues",
      desc: "Report other public service complaints.",
    },
  ];

  const portals = [
    {
      icon: <Users />,
      title: "Citizen Portal",
      desc: "Register complaints, upload evidence and track your complaint status.",
      button: "Citizen Login",
    },
    {
      icon: <Building2 />,
      title: "Official Portal",
      desc: "Verified officials can view assigned complaints and update progress.",
      button: "Official Login",
    },
    {
      icon: <ShieldCheck />,
      title: "Admin Portal",
      desc: "Authorized administrators can manage users, departments and reports.",
      button: "Admin Login",
    },
  ];

  // Admin complaint filters.
  const filteredAdminComplaints = adminComplaints.filter((complaint) => {
    const status = String(complaint.status || "")
      .toLowerCase()
      .replaceAll(" ", "_");

    const matchesStatus =
      adminStatusFilter === "all" ||
      status === adminStatusFilter;

    const matchesCategory =
      adminCategoryFilter === "all" ||
      complaint.category === adminCategoryFilter;

    const searchText = adminSearch.toLowerCase();

    const matchesSearch =
      String(complaint.id).includes(searchText) ||
      String(complaint.title || "").toLowerCase().includes(searchText) ||
      String(complaint.location || "").toLowerCase().includes(searchText) ||
      String(complaint.user_id || "").includes(searchText);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusLabel = (status) => {
    const normalized = String(status || "submitted")
      .toLowerCase()
      .replaceAll(" ", "_");

    return {
      submitted: "Submitted",
      in_progress: "In Progress",
      resolved: "Resolved",
      completed: "Resolved",
    }[normalized] || status || "Submitted";
  };

  const getStatusColor = (status) => {
    const normalized = String(status || "submitted")
      .toLowerCase()
      .replaceAll(" ", "_");

    return {
      submitted: "#b7791f",
      in_progress: "#1769aa",
      resolved: "#16804a",
      completed: "#16804a",
    }[normalized] || "#64748b";
  };

  // Authentication screen.
  if (showAuth) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  // Complaint details screen.
  if (selectedComplaint) {
    const detailStatus = String(
      selectedComplaint.status || "submitted"
    ).toLowerCase().replaceAll(" ", "_");

    const detailStatusLabel = getStatusLabel(detailStatus);

    const steps = [
      {
        status: "submitted",
        title: "Complaint Submitted",
        description: "Your complaint has been successfully registered.",
      },
      {
        status: "in_progress",
        title: "Work in Progress",
        description: "The concerned department is working on your issue.",
      },
      {
        status: "resolved",
        title: "Issue Resolved",
        description: "The complaint has been marked as resolved.",
      },
    ];

    const currentStep = {
      submitted: 0,
      in_progress: 1,
      resolved: 2,
      completed: 2,
    }[detailStatus] ?? 0;

    return (
      <div style={pageStyle}>
        <div style={formCardStyle}>
          <h2 style={{ color: "#173b66" }}>Complaint Details</h2>

          <p style={{ color: "#64748b" }}>
            Complete information about this complaint.
          </p>

          <div style={detailItemStyle}>
            <strong>Complaint ID</strong>
            <p>{selectedComplaint.id}</p>
          </div>

          <div style={detailItemStyle}>
            <strong>Citizen User ID</strong>
            <p>{selectedComplaint.user_id || "Not available"}</p>
          </div>

          <div style={detailItemStyle}>
            <strong>Title</strong>
            <p>{selectedComplaint.title}</p>
          </div>

          <div style={detailItemStyle}>
            <strong>Description</strong>
            <p>{selectedComplaint.description || "Not available"}</p>
          </div>

          <div style={detailItemStyle}>
            <strong>Location</strong>
            <p>{selectedComplaint.location}</p>
          </div>

          <div style={detailItemStyle}>
            <strong>Category</strong>
            <p>{selectedComplaint.category}</p>
          </div>

          <div style={detailItemStyle}>
            <strong>Severity</strong>
            <p>{selectedComplaint.severity || "Pending"}</p>
          </div>

          <div style={detailItemStyle}>
            <strong>Status</strong>
            <p>{detailStatusLabel}</p>
          </div>

          {/* Complaint Progress Timeline */}
          <div style={timelineContainerStyle}>
            <h3 style={{ color: "#173b66", marginBottom: "25px" }}>
              Complaint Progress
            </h3>

            {steps.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;

              return (
                <div
                  key={step.status}
                  style={{
                    display: "flex",
                    gap: "15px",
                    marginBottom:
                      index === steps.length - 1 ? "0" : "25px",
                  }}
                >
                  <div style={timelineMarkerColumn}>
                    <div
                      style={{
                        ...timelineCircleStyle,
                        background: isCompleted ? "#16a34a" : "#cbd5e1",
                      }}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>

                    {index !== steps.length - 1 && (
                      <div
                        style={{
                          ...timelineLineStyle,
                          background:
                            index < currentStep ? "#16a34a" : "#cbd5e1",
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <strong
                      style={{
                        color: isCompleted ? "#15803d" : "#64748b",
                      }}
                    >
                      {step.title}
                    </strong>

                    <p style={timelineDescriptionStyle}>
                      {step.description}
                    </p>

                    {isCurrent && (
                      <span style={currentStatusStyle}>
                        CURRENT STATUS
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            style={primaryButton}
            onClick={() => setSelectedComplaint(null)}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Complaint form screen.
  if (showComplaintForm) {
    return (
      <div style={pageStyle}>
        <div style={formCardStyle}>
          <h2 style={{ color: "#173b66" }}>Report a Civic Issue</h2>

          <p>
            Logged in as:{" "}
            <strong>{authData?.name || authData?.email}</strong>
          </p>

          <form onSubmit={handleComplaintSubmit}>
            <label>Complaint Title</label>
            <input
              type="text"
              placeholder="Example: Damaged road near college"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={formInput}
            />

            <label>Description</label>
            <textarea
              placeholder="Explain the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              style={formInput}
            />

            <label>Location</label>
            <input
              type="text"
              placeholder="Enter the location of the issue"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              style={formInput}
            />

            <label>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={formInput}
            >
              {services.map((service) => (
                <option key={service.title} value={service.title}>
                  {service.title}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={submitting}
              style={primaryButton}
            >
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>

          {message && <p style={{ marginTop: "15px" }}>{message}</p>}

          <button
            type="button"
            onClick={() => {
              setShowComplaintForm(false);
              setMessage("");
            }}
            style={backButton}
          >
            Back to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="top-strip">
        <span>Government Services | Public Grievance Platform</span>
        <span>Citizen-first • Transparent • Accountable</span>
      </div>

      <header className="navbar">
        <a className="brand" href="#home">
          <div className="brand-logo">
            <ShieldCheck size={29} />
          </div>

          <div>
            <h2>JanAwaaz</h2>
            <p>CIVICTRACK AI</p>
          </div>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#portals" onClick={() => setMenuOpen(false)}>Portals</a>
          <a href="#process" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>

        <div className="nav-actions">
          <div className="language-select">
            <Globe size={17} />

            <select value={i18n.language} onChange={changeLanguage}>
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
              <option value="bn">বাংলা</option>
              <option value="ta">தமிழ்</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="ml">മലയാളം</option>
              <option value="mr">मराठी</option>
            </select>
          </div>

          {authData && (
            <>
              <span style={userNameStyle}>
                {authData.name || authData.email}
              </span>

              <button
                type="button"
                className="login-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="home">
          <div className="hero-content">
            <div className="hero-tag">
              <span className="live-dot"></span>
              DIGITAL CIVIC GOVERNANCE PLATFORM
            </div>

            <h1>
              Your Voice.
              <br />
              <span>Your Community.</span>
              <br />
              Your Future.
            </h1>

            <p className="hero-description">
              A smarter way to report civic issues, connect with responsible
              departments and track public complaints transparently.
            </p>

            <div className="hero-buttons">
              <a href="#process" className="secondary-button">
                Learn More
              </a>
            </div>

            <div className="hero-features">
              <span><ShieldCheck size={17} /> Secure Platform</span>
              <span><Eye size={17} /> Transparent Tracking</span>
              <span><Globe size={17} /> Multilingual Access</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-icon"><MapPin size={34} /></div>
              <h3>Better Communities Start With You</h3>
              <p>
                Report an issue. Follow its progress. Make your voice count.
              </p>
              <div className="visual-divider"></div>
              <div className="visual-status">
                <span className="status-dot"></span>
                Complaint tracking platform
              </div>
            </div>

            <div className="floating-card">
              <CheckCircle size={21} />
              <span>Accountability matters</span>
            </div>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="trust-bar">
          <div><ShieldCheck /><span>Secure Access</span></div>
          <div><FileText /><span>Digital Complaints</span></div>
          <div><Search /><span>Track Progress</span></div>
          <div><CheckCircle /><span>Verified Officials</span></div>
        </section>

        {/* CITIZEN DASHBOARD */}
        {authData && authData.role === "citizen" && (
          <section className="section" style={{ background: "#f4f7fb" }}>
            <div className="section-heading">
              <span className="section-label">CITIZEN DASHBOARD</span>
              <h2>Welcome, {authData.name || authData.email}</h2>
              <p>View and track the complaints you have submitted.</p>
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={() => openComplaintForm()}
            >
              Submit a New Complaint <ArrowRight size={18} />
            </button>

            <div style={complaintTableCard}>
              <div style={tableHeadingStyle}>
                <h3>My Complaints</h3>

                <button
                  type="button"
                  onClick={refreshComplaints}
                  disabled={loadingComplaints}
                  style={refreshButtonStyle}
                >
                  {loadingComplaints ? "Refreshing..." : "Refresh Status"}
                </button>
              </div>

              {loadingComplaints ? (
                <p>Loading your complaints...</p>
              ) : complaints.length === 0 ? (
                <p>You haven't submitted any complaints yet.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: "#edf3f9" }}>
                        <th style={tableHeaderCell}>S.No.</th>
                        <th style={tableHeaderCell}>Title</th>
                        <th style={tableHeaderCell}>Location</th>
                        <th style={tableHeaderCell}>Category</th>
                        <th style={tableHeaderCell}>Severity</th>
                        <th style={tableHeaderCell}>Status</th>
                        <th style={tableHeaderCell}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {complaints.map((complaint, index) => {
                        const status = String(
                          complaint.status || "submitted"
                        ).toLowerCase().replaceAll(" ", "_");

                        return (
                          <tr key={complaint.id}>
                            <td style={tableCell}>{index + 1}</td>
                            <td style={tableCell}>{complaint.title}</td>
                            <td style={tableCell}>{complaint.location}</td>
                            <td style={tableCell}>{complaint.category}</td>
                            <td style={tableCell}>
                              {complaint.severity || "Pending"}
                            </td>
                            <td style={tableCell}>
                              <span
                                style={{
                                  background: `${getStatusColor(status)}18`,
                                  color: getStatusColor(status),
                                  padding: "6px 10px",
                                  borderRadius: "20px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {getStatusLabel(status)}
                              </span>
                            </td>
                            <td style={tableCell}>
                              <button
                                type="button"
                                onClick={() => setSelectedComplaint(complaint)}
                                style={serviceButtonStyle}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {message && (
                <p style={{ marginTop: "15px", color: "#1769aa" }}>
                  {message}
                </p>
              )}
            </div>
          </section>
        )}

        {/* ADMIN DASHBOARD */}
        {authData && authData.role === "admin" && (
          <section className="section" style={{ background: "#f4f7fb" }}>
            <div className="section-heading">
              <span className="section-label">ADMINISTRATOR DASHBOARD</span>
              <h2>Welcome, {authData.name || authData.email}</h2>
              <p>View and manage all complaints submitted by citizens.</p>
            </div>

            {/* Admin summary */}
            <div style={adminSummaryGrid}>
              <div style={adminSummaryCard}>
                <span style={adminSummaryNumber}>
                  {adminComplaints.length}
                </span>
                <span>Total Complaints</span>
              </div>

              <div style={adminSummaryCard}>
                <span style={{ ...adminSummaryNumber, color: "#b7791f" }}>
                  {adminComplaints.filter(
                    (c) => c.status === "submitted"
                  ).length}
                </span>
                <span>Submitted</span>
              </div>

              <div style={adminSummaryCard}>
                <span style={{ ...adminSummaryNumber, color: "#1769aa" }}>
                  {adminComplaints.filter(
                    (c) => c.status === "in_progress"
                  ).length}
                </span>
                <span>In Progress</span>
              </div>

              <div style={adminSummaryCard}>
                <span style={{ ...adminSummaryNumber, color: "#16804a" }}>
                  {adminComplaints.filter(
                    (c) => c.status === "resolved"
                  ).length}
                </span>
                <span>Resolved</span>
              </div>
            </div>

            {/* Admin complaint table */}
            <div style={complaintTableCard}>
              <div style={tableHeadingStyle}>
                <div>
                  <h3>Complaints Received from Citizens</h3>
                  <p style={{ color: "#64748b", fontSize: "14px" }}>
                    Review complaints and update their progress.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshAdminComplaints}
                  disabled={loadingAdminComplaints}
                  style={refreshButtonStyle}
                >
                  {loadingAdminComplaints
                    ? "Refreshing..."
                    : "Refresh Complaints"}
                </button>
              </div>

              {/* Filters */}
              <div style={adminFiltersStyle}>
                <input
                  type="text"
                  placeholder="Search ID, title, location or user ID..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  style={adminSearchInputStyle}
                />

                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  style={adminFilterSelectStyle}
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>

                <select
                  value={adminCategoryFilter}
                  onChange={(e) => setAdminCategoryFilter(e.target.value)}
                  style={adminFilterSelectStyle}
                >
                  <option value="all">All Categories</option>
                  {services.map((service) => (
                    <option key={service.title} value={service.title}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>

              {loadingAdminComplaints ? (
                <p>Loading complaints received from citizens...</p>
              ) : adminComplaints.length === 0 ? (
                <p>No citizen complaints have been received yet.</p>
              ) : filteredAdminComplaints.length === 0 ? (
                <p>No complaints match your search or filters.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: "#edf3f9" }}>
                        <th style={tableHeaderCell}>ID</th>
                        <th style={tableHeaderCell}>Citizen ID</th>
                        <th style={tableHeaderCell}>Title</th>
                        <th style={tableHeaderCell}>Location</th>
                        <th style={tableHeaderCell}>Category</th>
                        <th style={tableHeaderCell}>Severity</th>
                        <th style={tableHeaderCell}>Current Status</th>
                        <th style={tableHeaderCell}>Update Status</th>
                        <th style={tableHeaderCell}>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAdminComplaints.map((complaint) => {
                        const selectedStatus =
                          draftStatuses[complaint.id] ||
                          complaint.status ||
                          "submitted";

                        const hasChanges =
                          selectedStatus !== complaint.status;

                        return (
                          <tr key={complaint.id}>
                            <td style={tableCell}>{complaint.id}</td>

                            <td style={tableCell}>
                              {complaint.user_id || "N/A"}
                            </td>

                            <td style={tableCell}>
                              {complaint.title}
                            </td>

                            <td style={tableCell}>
                              {complaint.location}
                            </td>

                            <td style={tableCell}>
                              {complaint.category}
                            </td>

                            <td style={tableCell}>
                              {complaint.severity || "Pending"}
                            </td>

                            <td style={tableCell}>
                              <span
                                style={{
                                  background: `${getStatusColor(complaint.status)}18`,
                                  color: getStatusColor(complaint.status),
                                  padding: "6px 10px",
                                  borderRadius: "20px",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {getStatusLabel(complaint.status)}
                              </span>
                            </td>

                            <td style={tableCell}>
                              <select
                                value={selectedStatus}
                                onChange={(e) =>
                                  handleDraftStatusChange(
                                    complaint.id,
                                    e.target.value
                                  )
                                }
                                style={adminStatusSelectStyle}
                              >
                                <option value="submitted">Submitted</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                              </select>

                              <button
                                type="button"
                                disabled={
                                  !hasChanges ||
                                  updatingComplaintId === complaint.id
                                }
                                onClick={() =>
                                  updateAdminComplaintStatus(complaint)
                                }
                                style={{
                                  ...saveStatusButtonStyle,
                                  opacity: hasChanges ? 1 : 0.5,
                                  cursor: hasChanges
                                    ? "pointer"
                                    : "not-allowed",
                                }}
                              >
                                {updatingComplaintId === complaint.id
                                  ? "Saving..."
                                  : "Save"}
                              </button>
                            </td>

                            <td style={tableCell}>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedComplaint(complaint)
                                }
                                style={serviceButtonStyle}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {message && (
                <p style={{ marginTop: "15px", color: "#1769aa" }}>
                  {message}
                </p>
              )}
            </div>
          </section>
        )}

        {/* OFFICIAL NOTICE */}
        {authData && authData.role === "official" && (
          <section className="section" style={{ background: "#f4f7fb" }}>
            <div className="section-heading">
              <span className="section-label">OFFICIAL PORTAL</span>
              <h2>Official Dashboard</h2>
              <p>
                The official-specific dashboard and assigned complaint
                workflow have not been connected yet.
              </p>
            </div>
          </section>
        )}

        {/* PORTALS */}
        <section className="section portals-section" id="portals">
          <div className="section-heading">
            <span className="section-label">ACCESS YOUR PORTAL</span>
            <h2>One Platform, Three Access Points</h2>
            <p>Choose the portal that matches your role.</p>
          </div>

          <div className="portal-grid">
            {portals.map((portal, index) => (
              <div className="portal-card" key={portal.title}>
                <div className={`portal-icon portal-${index}`}>
                  {portal.icon}
                </div>

                <h3>{portal.title}</h3>
                <p>{portal.desc}</p>

                <button
                  type="button"
                  className="portal-link"
                  onClick={() => {
                    setPendingCategory(null);
                    setShowAuth(true);
                  }}
                >
                  {portal.button} <ArrowRight size={17} />
                </button>
              </div>
            ))}
          </div>

          <p className="verification-note">
            <ShieldCheck size={17} />
            Official accounts require administrator verification before access.
          </p>
        </section>

        {/* CIVIC SERVICES */}
        <section className="section services-section" id="services">
          <div className="section-heading">
            <span className="section-label">CIVIC SERVICES</span>
            <h2>What Can You Report?</h2>
            <p>Choose the category that best describes your civic concern.</p>
          </div>

          <div className="service-grid">
            {services.map((service) => (
              <div className="service-card" key={service.title}>
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>

                <button
                  type="button"
                  onClick={() => openComplaintForm(service.title)}
                  style={serviceButtonStyle}
                >
                  Report issue <ArrowRight size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="process-section" id="process">
          <div className="section-heading">
            <span className="section-label">SIMPLE PROCESS</span>
            <h2>How JanAwaaz Works</h2>
            <p>A clear process designed to make civic reporting easier.</p>
          </div>

          <div className="process-grid">
            <div className="process-card">
              <div className="step-number">01</div>
              <FileText size={29} />
              <h3>Submit a Complaint</h3>
              <p>
                Citizens submit an issue with its description, location and
                supporting evidence.
              </p>
            </div>

            <div className="process-card">
              <div className="step-number">02</div>
              <Search size={29} />
              <h3>AI Analysis</h3>
              <p>
                AI helps classify the issue and recommends a suitable department.
              </p>
            </div>

            <div className="process-card">
              <div className="step-number">03</div>
              <Building2 size={29} />
              <h3>Department Review</h3>
              <p>
                Complaints are reviewed through administrative workflows.
              </p>
            </div>

            <div className="process-card">
              <div className="step-number">04</div>
              <CheckCircle size={29} />
              <h3>Track Progress</h3>
              <p>
                Citizens can follow recorded status updates and resolution
                progress.
              </p>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="transparency-section" id="about">
          <div className="transparency-content">
            <span className="section-label">TRANSPARENCY & TRUST</span>
            <h2>Every Voice Deserves to Be Heard.</h2>
            <p>
              JanAwaaz aims to make civic grievance reporting accessible,
              transparent and accountable. Complaint updates and administrative
              actions will be recorded to support public trust.
            </p>
          </div>

          <div className="transparency-icon">
            <ShieldCheck size={100} strokeWidth={1.2} />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer" id="contact">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="brand-logo"><ShieldCheck size={28} /></div>

            <div>
              <h2>JanAwaaz</h2>
              <p>Your Voice. Your Community. Your Future.</p>
            </div>
          </div>

          <p className="footer-description">
            A civic technology initiative for accessible public grievance
            reporting and transparent complaint tracking.
          </p>
        </div>

        <div className="footer-bottom">
          <span>JanAwaaz – CivicTrack AI</span>
          <span>Project prototype | Not an official government website</span>
        </div>
      </footer>
    </div>
  );
}

// Styles.

const pageStyle = {
  minHeight: "100vh",
  background: "#f4f7fb",
  padding: "40px 20px",
};

const formCardStyle = {
  maxWidth: "650px",
  margin: "0 auto",
  background: "#ffffff",
  padding: "30px",
  borderRadius: "16px",
  boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
};

const formInput = {
  display: "block",
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  marginBottom: "18px",
  border: "1px solid #d5dce5",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const primaryButton = {
  width: "100%",
  padding: "13px",
  marginTop: "12px",
  background: "#1769aa",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
};

const backButton = {
  marginTop: "18px",
  padding: "10px 16px",
  background: "#e8eef5",
  color: "#173b66",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const userNameStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#173b66",
  whiteSpace: "nowrap",
};

const complaintTableCard = {
  marginTop: "30px",
  background: "#ffffff",
  padding: "22px",
  borderRadius: "14px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
};

const tableHeadingStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "20px",
};

const refreshButtonStyle = {
  padding: "9px 16px",
  background: "#1769aa",
  color: "white",
  border: "none",
  borderRadius: "7px",
  cursor: "pointer",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "850px",
  textAlign: "left",
};

const tableHeaderCell = {
  padding: "14px",
  borderBottom: "1px solid #dce4ed",
  whiteSpace: "nowrap",
};

const tableCell = {
  padding: "14px",
  borderBottom: "1px solid #e5eaf0",
  fontSize: "14px",
};

const serviceButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#1769aa",
  cursor: "pointer",
  fontWeight: "600",
};

const detailItemStyle = {
  padding: "12px 0",
  borderBottom: "1px solid #e5eaf0",
  color: "#334155",
};

const adminSummaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "15px",
  marginTop: "25px",
};

const adminSummaryCard = {
  background: "#ffffff",
  padding: "22px",
  borderRadius: "12px",
  boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "600",
};

const adminSummaryNumber = {
  fontSize: "28px",
  color: "#173b66",
  fontWeight: "700",
};

const adminFiltersStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const adminSearchInputStyle = {
  flex: "2 1 240px",
  minWidth: "200px",
  padding: "11px",
  border: "1px solid #d5dce5",
  borderRadius: "8px",
  fontSize: "14px",
};

const adminFilterSelectStyle = {
  flex: "1 1 160px",
  padding: "11px",
  border: "1px solid #d5dce5",
  borderRadius: "8px",
  background: "#ffffff",
  fontSize: "14px",
};

const adminStatusSelectStyle = {
  display: "block",
  width: "135px",
  padding: "8px",
  border: "1px solid #d5dce5",
  borderRadius: "6px",
  marginBottom: "7px",
  background: "#ffffff",
};

const saveStatusButtonStyle = {
  padding: "7px 12px",
  background: "#1769aa",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "600",
};

const timelineContainerStyle = {
  marginTop: "25px",
  padding: "20px",
  background: "#f8fafc",
  borderRadius: "12px",
};

const timelineMarkerColumn = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const timelineCircleStyle = {
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
};

const timelineLineStyle = {
  width: "3px",
  height: "45px",
};

const timelineDescriptionStyle = {
  color: "#64748b",
  marginTop: "5px",
  fontSize: "14px",
};

const currentStatusStyle = {
  color: "#15803d",
  fontSize: "12px",
  fontWeight: "bold",
};

export default App;
