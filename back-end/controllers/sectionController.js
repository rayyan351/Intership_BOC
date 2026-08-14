const Section = require('../models/Section');

// GET all display sections with populated products & deals
const getSections = async (req, res) => {
  try {
    const sections = await Section.find({})
      .populate('products', 'name price image categories isShown')
      .populate('deals', 'title dealPrice image isShown')
      .sort({ displayOrder: 1, createdAt: -1 });
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching display sections', error: error.message });
  }
};

// POST create display section
const createSection = async (req, res) => {
  try {
    const { title, subtitle, products, deals, displayOrder } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Section title is required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existingSection = await Section.findOne({ slug });
    if (existingSection) {
      return res.status(400).json({ message: 'A section with this title already exists' });
    }

    const sectionCount = await Section.countDocuments();

    const newSection = new Section({
      title: title.trim(),
      slug,
      subtitle,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : sectionCount + 1,
      products: products || [],
      deals: deals || [],
      isShown: true,
    });

    const savedSection = await newSection.save();
    const populatedSection = await Section.findById(savedSection._id)
      .populate('products', 'name price image categories isShown')
      .populate('deals', 'title dealPrice image isShown');

    res.status(201).json(populatedSection);
  } catch (error) {
    res.status(500).json({ message: 'Error creating section', error: error.message });
  }
};

// PUT update display section
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, products, deals, displayOrder, isShown } = req.body;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    if (title) {
      section.title = title.trim();
      section.slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }
    if (subtitle !== undefined) section.subtitle = subtitle;
    if (products !== undefined) section.products = products;
    if (deals !== undefined) section.deals = deals;
    if (displayOrder !== undefined) section.displayOrder = Number(displayOrder);
    if (isShown !== undefined) section.isShown = Boolean(isShown);

    const updatedSection = await section.save();
    const populatedSection = await Section.findById(updatedSection._id)
      .populate('products', 'name price image categories isShown')
      .populate('deals', 'title dealPrice image isShown');

    res.status(200).json(populatedSection);
  } catch (error) {
    res.status(500).json({ message: 'Error updating section', error: error.message });
  }
};

// DELETE section
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    await Section.findByIdAndDelete(id);
    res.status(200).json({ message: 'Section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting section', error: error.message });
  }
};

module.exports = { getSections, createSection, updateSection, deleteSection };