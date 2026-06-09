import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ isAdmin, isStudent, isTeacher, isCommittee }) => {
    return (
        <div className="sidebar">
            <ul className="nav-list">
                <li className="nav-item">
                    <Link to="/dashboard" className="nav-link">
                        <span className="nav-icon">🏠</span>
                        <span>Dashboard</span>
                    </Link>
                </li>

                {/* Student Links */}
                {isStudent && (
                    <>
                        <li className="nav-item">
                            <Link to="/student-milestones" className="nav-link">
                                <span className="nav-icon">✅</span>
                                <span>Milestones</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/student/defense-submission" className="nav-link">
                                <span className="nav-icon">📄</span>
                                <span>Proposal Defense Submission</span>
                            </Link>
                        </li>
                    </>
                )}

                {/* Teacher Links */}
                {isTeacher && (
                    <>
                        <li className="nav-item">
                            <Link to="/supervisor-proposals" className="nav-link">
                                <span className="nav-icon">📋</span>
                                <span>Proposals</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/teacher/evaluations" className="nav-link">
                                <span className="nav-icon">🎓</span>
                                <span>Proposal Defense Evaluation</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/supervisor/milestone-review" className="nav-link">
                                <span className="nav-icon">✅</span>
                                <span>Milestone Review</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/supervisor/student-evaluations" className="nav-link">
                                <span className="nav-icon">📈</span>
                                <span>Student Evaluations</span>
                            </Link>
                        </li>
                    </>
                )}

                {/* Admin Links */}
                {isAdmin && (
                    <>
                        <li className="nav-item">
                            <Link to="/admin/users" className="nav-link">
                                <span className="nav-icon">👥</span>
                                <span>User Management</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/admin/projects" className="nav-link">
                                <span className="nav-icon">📁</span>
                                <span>Project Management</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/admin/proposals" className="nav-link">
                                <span className="nav-icon">📝</span>
                                <span>Proposal Management</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/admin/supervisor-workload" className="nav-link">
                                <span className="nav-icon">📊</span>
                                <span>Supervisor Workload</span>
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link to="/admin/proposals?tab=defense" className="nav-link">
                                <span className="nav-icon">🛡️</span>
                                <span>Proposal Defense</span>
                            </Link>
                        </li>
                    </>
                )}

                {/* Committee / Coordinator Links */}
                {(isAdmin || isCommittee) && (
                    <li className="nav-item">
                        <Link to="/committee/evaluate" className="nav-link">
                            <span className="nav-icon">⚖️</span>
                            <span>Evaluate Projects</span>
                        </Link>
                    </li>
                )}

                {(isAdmin || isCommittee) && (
                    <li className="nav-item">
                        <Link to="/admin/grade-summary" className="nav-link">
                            <span className="nav-icon">📈</span>
                            <span>Grade Summary</span>
                        </Link>
                    </li>
                )}

                {/* Common Links */}
                <li className="nav-item">
                    <Link to="/profile" className="nav-link">
                        <span className="nav-icon">👤</span>
                        <span>Profile</span>
                    </Link>
                </li>
                <li className="nav-item">
                    <Link to="/change-password" className="nav-link">
                        <span className="nav-icon">⚙️</span>
                        <span>Change Password</span>
                    </Link>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;