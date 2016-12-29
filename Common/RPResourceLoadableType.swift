//
//  ResourceLoadableType.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

protocol ResourceLoadableType: class {

    static var resourcesNeedLoading: Bool { get }
    //static func loadResourcesWithCompletionHandler(_ completionHandler: () -> ())
    static func loadResources(withCompletionHandler completionHandler: @escaping () -> ())
    static func purgeResources()
}
