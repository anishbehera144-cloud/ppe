import { useEffect, useState } from 'react';

const styles = {
  container: {
    fontFamily: 'Segoe UI, sans-serif',
    background: 'linear-gradient(135deg, #00416A, #E4E5E6)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  box: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 900,
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  input: { width: '100%', padding: 10, marginTop: 10, marginBottom: 12, borderRadius: 6, border: '1px solid #ccc' },
  btn: { background: '#00416A', color: 'white', padding: '10px 14px', border: 'none', cursor: 'pointer', borderRadius: 6 }
};

export default function Home() {
  const [view, setView] = useState('login');
  // don't read localStorage during SSR — hydrate on client
  const [currentUser, setCurrentUser] = useState(null);

  // hydrate user from localStorage after mount to avoid SSR/client markup mismatch
  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
        // show dashboard automatically for hydrated user
        setView('dashboard');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [changePwd, setChangePwd] = useState({ email: '', oldPassword: '', newPassword: '', confirm: '' });
  const [signup, setSignup] = useState({ username: '', employee_id: '', email: '', password: '' });

  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ equipment: '', quantity: 1, reason: '' });

  const API_BASE = '/api';

  useEffect(() => { if (currentUser) loadRequests(); }, [currentUser]);

  async function login() {
    if (!loginEmail || !loginPassword) return alert('Fill fields');
    const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
    const data = await res.json();
    if (res.ok) { setCurrentUser(data); localStorage.setItem('currentUser', JSON.stringify(data)); setView('dashboard'); }
    else alert(data.msg || 'Login failed');
  }

  async function signUp() {
    const { username, employee_id, email, password } = signup;
    if (!username || !employee_id || !email || !password) return alert('Fill fields');
    const res = await fetch(`${API_BASE}/auth/signup`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(signup) });
    const data = await res.json();
    if (res.ok) { alert('Signup ok, please login'); setView('login'); }
    else alert(data.msg || 'Signup failed');
  }

  async function changePassword() {
    const { email, oldPassword, newPassword, confirm } = changePwd;
    if (!email || !oldPassword || !newPassword || !confirm) return alert('Fill all fields');
    if (newPassword !== confirm) return alert('New passwords do not match');

    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, oldPassword, newPassword }) });
      const data = await res.json();
      if (res.ok) { alert(data.msg || 'Password changed'); setView('login'); }
      else alert(data.msg || 'Failed to change password');
    } catch (err) { alert('Error: ' + err.message); }
  }

  function logout() { setCurrentUser(null); localStorage.removeItem('currentUser'); setView('login'); }

  async function submitRequest() {
    if (!form.equipment || !form.quantity || !form.reason) return alert('Complete fields');
    const payload = { user: currentUser.username, userId: currentUser.employee_id, equipment: form.equipment, quantity: form.quantity, reason: form.reason };
    const res = await fetch(`${API_BASE}/requests`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();
    if (res.ok) { alert('Request submitted'); setForm({ equipment: '', quantity: 1, reason: '' }); loadRequests(); setView('dashboard'); }
    else alert(data.msg || 'Failed');
  }

  async function loadRequests() {
    if (!currentUser) return;
    try {
      let res;
      if (currentUser.role === 'store') res = await fetch(`${API_BASE}/requests`);
      else res = await fetch(`${API_BASE}/requests/user/${currentUser.employee_id}`);
      const data = await res.json();
      setRequests(data);
    } catch (err) { console.error(err); }
  }

  async function updateStatus(id, status) {
    const res = await fetch(`${API_BASE}/requests/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (res.ok) { alert('Status updated'); loadRequests(); }
    else alert(data.msg || 'Failed');
  }

  function exportCSV() {
    if (!requests || !requests.length) return alert('No requests to export');
    const rows = [];
    // header
    rows.push(['User', 'Equipment', 'Qty', 'Reason', 'Status', 'Created At']);
    requests.forEach(r => {
      const created = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
      rows.push([r.user || '', r.equipment || '', r.quantity || '', (r.reason || '').replace(/\n/g, ' '), r.status || '', created]);
    });
    const csv = rows.map(r => r.map(col => `"${String(col).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ppe_requests.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.container}>
      <div style={styles.box} className={`box ${view === 'login' ? 'small' : ''}`}>
        {(!currentUser && view === 'login') && (
          <div>
            <h2 style={{color:'red'}}>Login</h2>
            <input style={styles.input} value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="Email" />
            <input style={styles.input} value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} type="password" placeholder="Password" />
            <div style={{display:'flex', gap:10, alignItems:'center', marginTop:8}}>
              <button style={styles.btn} onClick={login}>Login</button>
              <button className="change-btn" onClick={()=>setView('changePassword')}>Change Password</button>
              <p style={{margin:0, marginLeft: 'auto'}}>Don't have an account? <a href="#" onClick={()=>setView('signup')}>Sign Up</a></p>
            </div>
          </div>
        )}

        {(!currentUser && view === 'signup') && (
          <div>
            <h2 style={{color:'red'}}>Sign Up</h2>
            <input style={styles.input} placeholder="Username" value={signup.username} onChange={e=>setSignup({...signup, username: e.target.value})} />
            <input style={styles.input} placeholder="Employee ID" value={signup.employee_id} onChange={e=>setSignup({...signup, employee_id: e.target.value})} />
            <input style={styles.input} placeholder="Email" value={signup.email} onChange={e=>setSignup({...signup, email: e.target.value})} />
            <input style={styles.input} placeholder="Password" type="password" value={signup.password} onChange={e=>setSignup({...signup, password: e.target.value})} />
            <button style={styles.btn} onClick={signUp}>Sign Up</button>
            <p>Have an account? <a href="#" onClick={()=>setView('login')}>Login</a></p>
          </div>
        )}

        {(!currentUser && view === 'changePassword') && (
          <div>
            <h2 style={{color:'red'}}>Change Password</h2>
            <input style={styles.input} placeholder="Email" value={changePwd.email} onChange={e=>setChangePwd({...changePwd, email: e.target.value})} />
            <input style={styles.input} type="password" placeholder="Current Password" value={changePwd.oldPassword} onChange={e=>setChangePwd({...changePwd, oldPassword: e.target.value})} />
            <input style={styles.input} type="password" placeholder="New Password" value={changePwd.newPassword} onChange={e=>setChangePwd({...changePwd, newPassword: e.target.value})} />
            <input style={styles.input} type="password" placeholder="Confirm New Password" value={changePwd.confirm} onChange={e=>setChangePwd({...changePwd, confirm: e.target.value})} />
            <div style={{display:'flex', gap:10}}>
              <button style={styles.btn} onClick={changePassword}>Change Password</button>
              <button style={{...styles.btn, background:'gray'}} onClick={()=>setView('login')}>Cancel</button>
            </div>
          </div>
        )}

  {(currentUser && view === 'dashboard' && currentUser.role !== 'store') && (
          <div>
            <h2>Welcome, {currentUser.username}</h2>
            <div style={{display:'flex', gap:10}}>
              <button style={styles.btn} onClick={()=>setView('request')}>+ New PPE Request</button>
              <button style={{...styles.btn, background:'gray'}} onClick={logout}>Logout</button>
            </div>
            <h3>Your Requests</h3>
            <div className="table-scroll">
              <table>
                <thead style={{background:'#00416A', color:'#fff'}}>
                  <tr><th>#</th><th>Equipment</th><th>Qty</th><th>Reason</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {requests.map((r,i)=> (
                    <tr key={r._id}>
                      <td>{i+1}</td>
                      <td>{r.equipment}</td>
                      <td>{r.quantity}</td>
                      <td>{r.reason}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(currentUser && view === 'request') && (
          <div>
            <h2>PPE Request Form</h2>
            <select style={styles.input} value={form.equipment} onChange={e=>setForm({...form, equipment: e.target.value})}>
              <option value="">-- Select Equipment --</option>
              <option>FR Jackets(S)</option>
              <option>FR Jackets(M)</option>
              <option>FR Jackets(L)</option>
              <option>FR Jackets(XL)</option>
              <option>FR Jackets(XLL)</option>
              <option>FR Jackets(XLLL)</option>
              <option>FR Pant(S)</option>
              <option>FR Pant(M)</option>
              <option>FR Pant(L)</option>
              <option>FR Pant(XL)</option>
              <option>FR Pant(XLL)</option>
              <option>FR Pant(XLLL)</option>
              <option>Safety Shoes(6)</option>
              <option>Safety Shoes(7)</option>
              <option>Safety Shoes(8)</option>
              <option>Safety Shoes(9)</option>
              <option>Safety Shoes(10)</option>
              <option>Rubber Gloves</option>
              <option>Cavler Gloves</option>
              <option>PVC Coated Gloves</option>
              <option>Nose Mask</option>
              <option>Helmet</option>
              <option>Ear Plugs</option>
              <option>Goggles</option>
              <option>Over Head Goggles</option>
              <option>Face Shield With Frame</option>
              <option>Face Shield</option>
              <option>Leg Gaurd</option>
              <option>Neck Gaurd</option>
              <option>CO Monitor</option>
              <option>Multi Gas Detector</option>
            </select>
            <input type="number" style={styles.input} min={1} max={10} value={form.quantity} onChange={e=>setForm({...form, quantity: Number(e.target.value)})} />
            <textarea style={{...styles.input, height:80}} value={form.reason} onChange={e=>setForm({...form, reason: e.target.value})} />
            <div style={{display:'flex', gap:10}}>
              <button style={styles.btn} onClick={submitRequest}>Submit Request</button>
              <button style={{...styles.btn, background:'gray'}} onClick={()=>setView('dashboard')}>Cancel</button>
            </div>
          </div>
        )}

        {(currentUser && currentUser.role === 'store') && (
          <div>
            <h2>Welcome, {currentUser.username}</h2>
            <h3 style={{color:'red', marginTop:6}}>Store Incharge Dashboard</h3>
            <div style={{display:'flex', gap:10, marginTop:8}}>
              <button style={styles.btn} onClick={exportCSV}>⬇️ Export CSV</button>
              <button style={{...styles.btn, background:'gray'}} onClick={logout}>Logout</button>
            </div>
            <div className="table-scroll" style={{marginTop:12}}>
              <table>
                <thead style={{background:'#00416A', color:'#fff'}}>
                  <tr><th>#</th><th>User</th><th>Equipment</th><th>Qty</th><th>Reason</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {requests.map((r,i)=> (
                    <tr key={r._id}>
                      <td>{i+1}</td>
                      <td>{r.user}</td>
                      <td>{r.equipment}</td>
                      <td>{r.quantity}</td>
                      <td>{r.reason}</td>
                      <td>{r.status}</td>
                      <td>
                        <select defaultValue={r.status} onChange={e=>updateStatus(r._id, e.target.value)}>
                          <option>Pending</option>
                          <option>Approved</option>
                          <option>Issued</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .box { position: relative; }
        .box::before {
          content: "";
          position: absolute;
          inset: 0;
          display: block;
          background-image: url('/logo2.jpg');
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          opacity: 0.18; /* slightly stronger watermark */
          pointer-events: none;
          z-index: 0;
        }
        .box.small { max-width: 640px; }
        .box > * { position: relative; z-index: 1; }

        .change-btn {
          background: #00416A;
          color: white;
          padding: 10px 14px;
          border: none;
          cursor: pointer;
          border-radius: 6px;
        }
        .change-btn:hover {
          text-decoration: underline;
          background: #0060a5; /* match login hover color */
        }
        .table-scroll {
          overflow-x: auto;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
        .table-scroll table {
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
        }
        .table-scroll th,
        .table-scroll td {
          padding: 10px 12px;
          border: 1px solid #e9e9e9;
          vertical-align: middle;
        }
        .table-scroll thead th {
          background: #00416A;
          color: #fff;
          font-weight: 600;
          text-align: left;
        }
        .table-scroll tbody tr:nth-child(odd) td { background: rgba(0,0,0,0.02); }
        .table-scroll td:first-child, .table-scroll th:first-child { width: 60px; text-align: center; }
        .table-scroll td:nth-child(3), .table-scroll th:nth-child(3) { width: 80px; text-align: center; }
        .table-scroll td:nth-child(5), .table-scroll th:nth-child(5) { width: 120px; text-align: center; }
        /* ensure table content stays above the watermark */
        .box .table-scroll, .box .table-scroll * { position: relative; z-index: 1; }
      `}</style>
    </div>
  );
}
