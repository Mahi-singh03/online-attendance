// pages/api/staff/index.js
import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const staff = await Staff.find({});
      res.status(200).json(staff);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching staff' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, email, password, allowedIps } = req.body;
      
      // Check if staff already exists
      const existingStaff = await Staff.findOne({ email });
      if (existingStaff) {
        return res.status(400).json({ error: 'Staff member already exists' });
      }

      // Process allowed IPs
      let processedIps = [];
      if (allowedIps && allowedIps.trim() !== '') {
        processedIps = allowedIps.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
      }

      const staff = new Staff({
        name,
        email,
        password,
        allowedIps: processedIps
      });

      await staff.save();
      res.status(201).json(staff);
    } catch (error) {
      res.status(500).json({ error: 'Error creating staff member' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}