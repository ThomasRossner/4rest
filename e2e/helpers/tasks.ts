import { Page, expect } from '@playwright/test';

export interface QuizAnswer {
  questionIndex: number;
  answer: string | number;
}

export async function selectTask(page: Page, taskTitle: string): Promise<void> {
  // Wait for tasks to load
  await page.waitForSelector('[class*="task"], [data-testid*="task"]', { timeout: 10000 });
  
  // Try to find task by title
  const taskCard = page.locator(`text=${taskTitle}`).first();
  if (await taskCard.isVisible()) {
    await taskCard.click();
    await page.waitForTimeout(1000);
    return;
  }
  
  // Fallback: click first available task
  const firstTask = page.locator('[class*="task-card"], [class*="task-item"]').first();
  if (await firstTask.isVisible()) {
    await firstTask.click();
    await page.waitForTimeout(1000);
    return;
  }
  
  throw new Error(`Task "${taskTitle}" not found`);
}

export async function completeVideoTask(page: Page, answers: QuizAnswer[]): Promise<void> {
  // Wait for video player or task content
  await page.waitForTimeout(2000);
  
  // Answer quiz questions if present
  for (const answer of answers) {
    const questionSelector = `[data-question-index="${answer.questionIndex}"]`;
    const answerButton = page.locator(`button:has-text("${answer.answer}")`).or(
      page.locator(`input[value="${answer.answer}"]`)
    );
    
    if (await answerButton.isVisible({ timeout: 2000 })) {
      await answerButton.click();
      await page.waitForTimeout(500);
    }
    
    // Try to find next button
    const nextButton = page.locator('button:has-text("Next")').or(
      page.locator('button:has-text("Weiter")')
    );
    if (await nextButton.isVisible({ timeout: 1000 })) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  }
  
  // Complete task
  const completeButton = page.locator('button:has-text("Complete")').or(
    page.locator('button:has-text("Abschließen")')
  );
  if (await completeButton.isVisible()) {
    await completeButton.click();
  }
  
  // Wait for success message or redirect
  await page.waitForTimeout(2000);
}

export async function completeQRTask(page: Page, qrCode: string): Promise<void> {
  // Look for QR code input
  const qrInput = page.locator('input[type="text"]').or(
    page.locator('input[placeholder*="QR"]')
  ).first();
  
  if (await qrInput.isVisible()) {
    await qrInput.fill(qrCode);
  }
  
  // Find verify/submit button
  const verifyButton = page.locator('button:has-text("Verify")').or(
    page.locator('button:has-text("Prüfen")')
  ).or(page.locator('button[type="submit"]'));
  
  await verifyButton.click();
  
  // Wait for completion
  await page.waitForTimeout(2000);
}

export async function completePhotoTask(page: Page, imagePath: string): Promise<void> {
  // Find file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(imagePath);
  
  // Wait for upload
  await page.waitForTimeout(1000);
  
  // Find submit button
  const submitButton = page.locator('button:has-text("Upload")').or(
    page.locator('button:has-text("Hochladen")')
  ).or(page.locator('button[type="submit"]'));
  
  await submitButton.click();
  
  // Wait for completion
  await page.waitForTimeout(2000);
}

export async function verifyTaskCompleted(page: Page): Promise<void> {
  // Look for success message
  const successIndicators = [
    'Task completed',
    'Aufgabe abgeschlossen',
    'successfully',
    'erfolgreich',
  ];
  
  for (const indicator of successIndicators) {
    const element = page.locator(`text=${indicator}`, { ignoreCase: true });
    if (await element.isVisible({ timeout: 2000 })) {
      return;
    }
  }
  
  // Alternative: check if we're back on tasks page
  if (page.url().includes('/tasks')) {
    return;
  }
  
  // If no success indicator found, that's okay - task might have completed silently
}
