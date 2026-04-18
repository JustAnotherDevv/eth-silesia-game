-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarEmoji" TEXT NOT NULL DEFAULT '🎩',
    "xp" INTEGER NOT NULL DEFAULT 100,
    "level" TEXT NOT NULL DEFAULT 'Rookie',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "badges" INTEGER NOT NULL DEFAULT 0,
    "specialty" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Community" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌟',
    "type" TEXT NOT NULL DEFAULT 'Community',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Community_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Membership_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InviteCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 25,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InviteCode_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "communityId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '📚',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "lessons" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Module_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_communityId_key" ON "Membership"("userId", "communityId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteCode_code_key" ON "InviteCode"("code");
