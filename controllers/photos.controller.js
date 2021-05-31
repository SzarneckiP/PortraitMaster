const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');


/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const regExp = new RegExp(/(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/, "g");
    const correctTitle = title.match(regExp).join('');
    const correctAuthor = author.match(regExp).join('');

    if (correctAuthor !== author || correctTitle !== title) {
      res.status(400).res.json({ message: "err" });
    };

    const regExpEmail = RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    const correctEmail = regExpEmail.test(email);
    if (!correctEmail) {
      res.status(400).res.json({ message: 'err' });
    }


    if (title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0]; // cut abc.jpg -> jpg
      const correctExt = ['gif', 'jpg', 'png'];
      if (correctExt.includes(fileExt) && author.length <= 50 && title.length <= 25) {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        res.status(400).res.json({ message: 'err' });
      }

    } else {
      throw new Error('Wrong input!');
    }

  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const clientIp = requestIp.getClientIp(req);
    const newVoter = await Voter.findOne({ user: clientIp });

    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    if (newVoter) {
      if (!newVoter.votes.includes(req.params.id)) {
        res.status(400).json({ message: 'You added vote' });
      } else {

        newVoter.votes.push(req.params.id);
        await photoToUpdate.save();
        photoToUpdate.votes++;
        await newVoter.save();
        res.status(200).json({ message: 'ok' });
      }
    }
    else {
      const addVoter = new Voter({ user: clientIp, votes: req.params.id });
      await addVoter.save();
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.status(200).json({ message: 'OK' });
    }
  } catch (err) {
    console.error(err)
    res.status(500).json(err);

  }

};
