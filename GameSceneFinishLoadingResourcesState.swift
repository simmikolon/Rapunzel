//
//  GameSceneFinishLoadingResourcesState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 09.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit

class GameSceneFinishLoadingResourcesState: GameSceneState {

    // MARK: - Lifecycle
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        print("Finished loading resources!")
    }
}
