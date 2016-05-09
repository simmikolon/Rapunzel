//
//  RPGameSceneViewController.swift
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

struct RPGameSceneSettings {
    #if os(iOS)
    static let width: CGFloat = 768
    static let height: CGFloat = 1364
    #else
    static let width: CGFloat = 768
    static let height: CGFloat = 1364//768
    #endif
}

class RPGameSceneViewController: RPSKViewController {

    override func viewDidLoad() {
        
        super.viewDidLoad()

        let screenSize = CGSize(width: RPGameSceneSettings.width, height: RPGameSceneSettings.height)
        let gameScene = RPGameScene(size: screenSize)
        let skView = self.view as! SKView
        
        skView.showsFPS = true
        skView.showsNodeCount = true
        skView.showsDrawCount = true
        skView.ignoresSiblingOrder = true
        
        gameScene.scaleMode = .AspectFill
        gameScene.setup()

        skView.presentScene(gameScene)
    }
}
