const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { prisma } = require('./database');
const { verifyAppleToken } = require('apple-signin-auth');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;
        const profilePicture = profile.photos[0]?.value || null;

        if (!email) {
          return done(new Error('No email found from Google profile'), null);
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, update Google ID and profile picture if not set
          const updateData = {};
          if (!user.googleId) {
            updateData.googleId = googleId;
          }
          if (!user.profilePicture && profilePicture) {
            updateData.profilePicture = profilePicture;
          }

          if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData,
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                profilePicture: true,
                role: true,
                isActive: true,
                createdAt: true,
              },
            });
          } else {
            // Just return user with updated select fields for consistency
            user = await prisma.user.findUnique({
              where: { id: user.id },
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                profilePicture: true,
                role: true,
                isActive: true,
                createdAt: true,
              },
            });
          }
        } else {
          // Create new user
          const randomPassword = await bcrypt.hash(
            Math.random().toString(36).substring(2, 15),
            12
          );

          // Split name into firstName and lastName
          const nameParts = name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          user = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              name,
              password: randomPassword,
              googleId,
              profilePicture,
              role: 'USER',
              isActive: true,
              verifiedAt: new Date(),
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              phone: true,
              profilePicture: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Facebook OAuth Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/facebook/callback`,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0]?.value;
        const firstName = profile.name.givenName || '';
        const lastName = profile.name.familyName || '';
        const name = `${firstName} ${lastName}`.trim();
        const facebookId = profile.id;
        const profilePicture = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error('No email found from Facebook profile'), null);
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, update Facebook ID and profile picture if not set
          const updateData = {};
          if (!user.facebookId) {
            updateData.facebookId = facebookId;
          }
          if (!user.profilePicture && profilePicture) {
            updateData.profilePicture = profilePicture;
          }

          if (Object.keys(updateData).length > 0) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData,
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                name: true,
                phone: true,
                profilePicture: true,
                role: true,
                isActive: true,
                createdAt: true,
              },
            });
          }
        } else {
          // Create new user
          const randomPassword = await bcrypt.hash(
            Math.random().toString(36).substring(2, 15),
            12
          );

          user = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              name,
              password: randomPassword,
              facebookId,
              profilePicture,
              role: 'USER',
              isActive: true,
              verifiedAt: new Date(),
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              phone: true,
              profilePicture: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Facebook OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = profile.emails?.[0]?.value;
        const name =
          profile.displayName ||
          profile.username ||
          profile._json.name ||
          'GitHub User';
        const githubId = profile.id;
        const username = profile.username;

        // If no email in profile, try to fetch it from GitHub API
        if (!email) {
          try {
            const emailResponse = await axios.get(
              'https://api.github.com/user/emails',
              {
                headers: {
                  Authorization: `token ${accessToken}`,
                  'User-Agent': 'Rentverse-App',
                },
              }
            );

            // Find primary email or first verified email
            const emails = emailResponse.data;
            const primaryEmail = emails.find(e => e.primary && e.verified);
            const verifiedEmail = emails.find(e => e.verified);

            email =
              primaryEmail?.email || verifiedEmail?.email || emails[0]?.email;
          } catch (apiError) {
            console.error('Error fetching GitHub emails:', apiError.message);
          }
        }

        // If still no email, create a placeholder email using GitHub username
        if (!email) {
          email = `${username}@github.placeholder.com`;
        }

        // Check if user already exists by GitHub ID first
        let user = await prisma.user.findFirst({
          where: { githubId },
        });

        if (user) {
          // User exists with GitHub ID, just return
          return done(null, user);
        }

        // Check if user exists by email (but only if it's not a placeholder email)
        if (!email.includes('@github.placeholder.com')) {
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            // User exists with this email, link GitHub account
            user = await prisma.user.update({
              where: { id: user.id },
              data: { githubId },
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
              },
            });
            return done(null, user);
          }
        }

        // Create new user
        const randomPassword = await bcrypt.hash(
          Math.random().toString(36).substring(2, 15),
          12
        );

        user = await prisma.user.create({
          data: {
            email,
            name,
            password: randomPassword,
            githubId,
            role: 'USER',
            isActive: true,
            verifiedAt: new Date(),
          },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        return done(null, user);
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Twitter OAuth Strategy
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: `${process.env.BASE_URL}/api/auth/twitter/callback`,
      includeEmail: true,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.username;
        const twitterId = profile.id;

        if (!email) {
          return done(new Error('No email found from Twitter profile'), null);
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, update Twitter ID if not set
          if (!user.twitterId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { twitterId },
              select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
              },
            });
          }
        } else {
          // Create new user
          const randomPassword = await bcrypt.hash(
            Math.random().toString(36).substring(2, 15),
            12
          );

          user = await prisma.user.create({
            data: {
              email,
              name,
              password: randomPassword,
              twitterId,
              role: 'USER',
              isActive: true,
              verifiedAt: new Date(),
            },
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Twitter OAuth error:', error);
        return done(error, null);
      }
    }
  )
); // Apple Sign In handler (manual implementation since no official Passport strategy)
const handleAppleSignIn = async (appleToken, userInfo = null) => {
  try {
    // Verify Apple token
    const applePayload = await verifyAppleToken(appleToken, {
      audience: process.env.APPLE_CLIENT_ID,
      issuer: 'https://appleid.apple.com',
    });

    if (!applePayload) {
      throw new Error('Invalid Apple token');
    }

    const appleId = applePayload.sub;
    let email = applePayload.email;
    let name = 'Apple User';

    // If userInfo is provided (first time sign in), use it
    if (userInfo) {
      email = userInfo.email || email;
      name = userInfo.name
        ? `${userInfo.name.firstName || ''} ${userInfo.name.lastName || ''}`.trim()
        : name;
    }

    if (!email) {
      throw new Error('No email found from Apple Sign In');
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, update Apple ID if not set
      if (!user.appleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { appleId },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });
      }
    } else {
      // Create new user
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).substring(2, 15),
        12
      );

      user = await prisma.user.create({
        data: {
          email,
          name,
          password: randomPassword,
          appleId,
          role: 'USER',
          isActive: true,
          verifiedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    }

    return user;
  } catch (error) {
    console.error('Apple Sign In error:', error);
    throw error;
  }
};

module.exports = {
  passport,
  handleAppleSignIn,
};
