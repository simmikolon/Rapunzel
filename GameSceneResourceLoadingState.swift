//
//  GameSceneResourceLoadingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit

class GameSceneResourceLoadingState: GameSceneState {

    let operationQueue = OperationQueue()
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        loadResources()
    }
    
    fileprivate func loadResources() {
        
        let loadSceneOperation = Foundation.Operation()
        
        loadSceneOperation.completionBlock = { [unowned self] in
            
            /* Enter the next state on the main queue. */
            
            DispatchQueue.main.async {
                
                let didEnterReadyState = self.gameScene.stateMachine.enter(GameSceneCreateLevelEntityState.self)
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
