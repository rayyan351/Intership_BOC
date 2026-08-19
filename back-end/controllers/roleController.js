// back-end/controllers/roleController.js
const Role = require("../models/Role");
const { SYSTEM_MODULES } = require("../config/permissions");

// GET all roles & capabilities matrix
const getRolesAndModules = async (req, res) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 });
    res.status(200).json({
      roles,
      modules: SYSTEM_MODULES,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching roles", error: error.message });
  }
};

// POST create role
const createRole = async (req, res) => {
  try {
    const { name, description, permissions = [], color } = req.body;
    if (!name) return res.status(400).json({ message: "Role name is required" });

    const existing = await Role.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: "A role with this name already exists" });

    const role = await Role.create({
      name: name.trim(),
      description: description?.trim() || "",
      permissions,
      color: color || "blue",
    });

    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message || "Error creating role" });
  }
};

// PUT update role info or entire permission set
const updateRole = async (req, res) => {
  try {
    const { name, description, permissions, color } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (name) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (permissions !== undefined) role.permissions = permissions;
    if (color) role.color = color;

    await role.save();
    res.status(200).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message || "Error updating role" });
  }
};

// PATCH toggle single permission in a role (Instant Sync)
const toggleRolePermission = async (req, res) => {
  try {
    const { permissionKey, enable } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (enable) {
      if (!role.permissions.includes(permissionKey)) {
        role.permissions.push(permissionKey);
      }
    } else {
      role.permissions = role.permissions.filter((p) => p !== permissionKey);
    }

    await role.save();
    res.status(200).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const batchUpdateRolePermissions = async (req, res) => {
  try {
    const { permissionsToAdd = [], permissionsToRemove = [] } = req.body;
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    // Add keys without duplicates
    let updated = Array.from(new Set([...role.permissions, ...permissionsToAdd]));

    // Remove targeted keys
    if (permissionsToRemove.length > 0) {
      updated = updated.filter((p) => !permissionsToRemove.includes(p));
    }

    role.permissions = updated;
    await role.save();
    res.status(200).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE role
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: "Role not found" });
    if (role.isSystem) return res.status(400).json({ message: "System roles cannot be deleted" });

    await role.deleteOne();
    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRolesAndModules,
  createRole,
  updateRole,
  toggleRolePermission,
  batchUpdateRolePermissions,
  deleteRole,
};