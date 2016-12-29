//
//  GameSceneViewController.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

#if os(iOS)
    import UIKit
#else
    import Foundation
#endif

import SpriteKit

class GameSceneViewController: SKViewController {
    
    var sceneManager: SceneManager! 

    override func viewDidLoad() {
        
        super.viewDidLoad()
        let skView = self.view as! SKView
        
        let touchControlInputNode = TouchControlInputNode(frame: view.bounds, thumbStickNodeSize: CGSize(width: 0, height: 0))
        let inputManager = InputManager(nativeControlInputSource: touchControlInputNode)
        sceneManager = SceneManager(presentingView: skView, inputManager: inputManager)
        sceneManager.transitionToSceneWithSceneIdentifier(.home)
    }
}
