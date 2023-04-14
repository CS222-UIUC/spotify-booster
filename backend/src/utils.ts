// awaitAllPromises() - waits for all promises to resolve, then throws and error if any promise was rejected
export async function awaitAllPromises<T>(promises: Array<PromiseLike<T>>): Promise<Array<T>> {
  try {
    return await Promise.all(promises);
  } catch (error) {
    await Promise.allSettled(promises);
    throw error;
  }
}
