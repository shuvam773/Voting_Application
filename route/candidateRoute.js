const { jwtAuthMiddle, generateToken } = require('../middlewareJWTAuth/jwtMiddleAuth');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const express = require('express');
const router = express.Router();


//function to check whether the user is user or admin
const checkAdminRole = async (userId) => {
    try {
        if (!userId) return false;
        const user = await User.findById(userId);
        return user.role === "admin";
    }
    catch (error) {
        console.log("error occured ", error);
    }
}

//post method to create a candidate
router.post('/', async (req, res) => {
    try {
        const admin = await checkAdminRole(req.user.id);
        if (!admin) {
            return res.status(403).json({ message: "user is not admin" });
        }

        //extract the data from the request body in the data variable
        const data = req.body;

        //crearte a new user documnet in the db
        const newCandidate = new Candidate(data);

        //savew the instance in the db
        const response = await newCandidate.save();
        console.log("new candidate register or created succesffully");
        return res.status(200).json({ message: "suiccessfully created", response: response });

    } catch (err) {
        return res.status(500).json({ message: "invalid server error" });
    }
});

//put method to update the candidate data
router.put('/:candidateId', async (req, res) => {
    try {
        //first chek whether the user is admin or not
        const admin = await checkAdminRole(req.user.id);
        if (!admin) {
            return res.status(404).json({ message: "user is not admin" });
        }

        //extract the candidate id from the params i.e from the url paramemter
        const candidateId = req.params.candidateId;

        //update the the data of the candiate
        const updateCnadidate = req.body;

        //find the candidate by its id and update the data
        const updated = await Candidate.findByIdAndUpdate(candidateId, updateCnadidate, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            return res.status(401).json({ message: "not updated" });
        }
        console.log("data updated successfuly");
        return res.status(200).json({ message: "suiccessfully created", candidate: updated });
    } catch (error) {
        return res.status(500).json({ message: "invalid server error" });
    }
});


//delete the cxandidate by its id
router.delete('/candidateId', async (req, res) => {
    try {
        const admin = await checkAdminRole(req.user.id);
        if (!admin) {
            return res.status(404).json({ message: "user is not admin" });
        }

        //extract the candidate id from the ulr
        const candiateId = req.params.candiateId;
        const deleted = await Candidate.findByIdAndDelete(candiateId);
        if (!deleted) {
            return res.status(404).json({ message: "Candidate not found" });
        }
        console.log("deleted successfully");
        return res.status(200).json({ message: "deleting succesfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "invalid server error" });
    }
});

//get all the list of the candidate
router.get('/candidateList', async (req, res) => {
    try {
        //find all the candidate
        const candiate = await Candidate.find();

        //map all the candidate
        const list = candiate.map((data) => {
            return ({
                name: data.name,
                age: data.age,
                party: data.party,
            });
        });
        return res.status(200).json(list);

    }
    catch (error) {
        console.log("Error occured ", error);
        return res.status(500).json({ message: "internal server error" });
    }
});

//lets start voiting 
/*
case 1 : admin cant vote
case 2 : only user can vote if he is not voted
case 3 : increment the vote count
*/
router.post('/votes/:candidateID', jwtAuthMiddle, async (req, res) => {
    const candiateId = req.params.candidateID;
    const userId = req.user.id;
    try {
        const candidate = await Candidate.findById(candiateId);
        const user = await User.findById(userId);
        if (!candidate) {
            return res.status(401).json({ message: "unknown candidate " });
        }
        if (!user) {
            return res.status(401).json({ message: "unknown user " });
        }
        if (user.isVoted) {
            return res.status(404).json({ message: "already votes" });
        }

        const isAdmin = await checkAdminRole(req.user.id);
        if (isAdmin) {
            console.log("admin cant vote");
            return res.status(401).json({ message: "admin cant cast vote on ly user cant cast vote" });
        }

        //update the candidate docuimnet to record the vote
        candidate.votes.push({ user: userId });
        candidate.voteCount++;
        await candidate.save();

        //update the user documnet
        user.isVoted = true;
        await user.save();
        return res.status(200).json({ message: "successfully voted thank you" });

    } catch (error) {
        console.log("voing error");
        return res.status(500).json({ message: "internal server error" });
    }
});


//map the vote count of the parties in ascending order
router.get('/vote/voteCount', async (req, res) => {
    try {
        //find all the candidate and sort them by vote count
        const candidate = await Candidate.find().sort({ voteCount: 'desc' });
        //map alal the candidate to only return their name and vote
        const record = candidate.map((data) => {
            return ({
                party: data.party,
                count: data.voteCount,
            });
        });
        return res.status(200).json(record);
    } catch (error) {
        console.log("Error occured ", error);
        return res.status(500).json({ message: "internal server error" });
    }
});

