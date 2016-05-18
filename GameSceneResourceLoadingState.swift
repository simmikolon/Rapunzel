//
//  GameSceneResourceLoadingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit

class GameSceneResourceLoadingState: GameSceneState {

    let operationQueue = NSOperationQueue()
    
    override func didEnterWithPreviousState(previousState: GKState?) {
        super.didEnterWithPreviousState(previousState)
        loadResources()
    }
    
    private func loadResources() {
        
        let loadSceneOperation = NSOperation()
        
        loadSceneOperation.completionBlock = { [unowned self] in
            
            /* Enter the next state on the main queue. */
            
            dispatch_async(dispatch_get_main_queue()) {
                
                let didEnterReadyState = self.gameScene.stateMachine.enterState(GameSceneCreateLevelEntityState.self)
                assert(didEnterReadyState, "Failed to transition to `ReadyState` after resources were prepared.")
            }
        }
        
        for loadableType in gameScene.dataSource.loadableTypes {
            
            let operation = LoadResourcesOperation(loadableType: loadableType)
            
            /* Make `loadSceneOperation` dependent on the completion of the new operation. */
            
            loadSceneOperation.addDependency(operation)
            operationQueue.addOperation(operation)
        }
        
        operationQueue.addOperation(loadSceneOperation)
    }
}
